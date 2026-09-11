import { env, pipeline, type Message, type TextGenerationPipeline } from '@huggingface/transformers'

const MODEL_ID = 'onnx-community/LFM2-700M-ONNX'
const DTYPE_FOR = { wasm: 'q8', webgpu: 'q4' } as const

// Events this worker sends to the main thread
type WorkerEvent =
  | { type: 'progress'; file: string; percent: number }
  | { type: 'generating' }
  | { type: 'result'; text: string }
  | { type: 'error'; message: string }

// Commands the main thread sends in
type WorkerCommand = { type: 'load' } | { type: 'generate'; messages: Message[] }

// Self (self) is typed as Window under the project's DOM lib so cast to worker global shape
const workerScope = self as unknown as {
  postMessage(message: WorkerEvent): void
  onmessage: ((ev: MessageEvent<WorkerCommand>) => void) | null
}

let generatorPromise: Promise<TextGenerationPipeline> | null = null

async function detectDevice(): Promise<'webgpu' | 'wasm'> {
  try {
    const gpu = (navigator as { gpu?: { requestAdapter: () => Promise<unknown | null> } }).gpu
    const adapter = gpu ? await gpu.requestAdapter() : null
    return adapter ? 'webgpu' : 'wasm'
  } catch {
    return 'wasm'
  }
}

function configureWasm() {
  const threads = self.crossOriginIsolated ? navigator.hardwareConcurrency ?? 1 : 1
  if (!self.crossOriginIsolated) {
    console.warn('Generator: Not cross-origin isolated. Falling back to single-threaded WASM...')
  }

  Object.assign(env.backends.onnx.wasm!, { numThreads: threads })
}

const lastLoggedPercent = new Map<string, number>()

export function getGenerator(): Promise<TextGenerationPipeline> {
  if (!generatorPromise) {
    generatorPromise = (async () => {
      const device = await detectDevice()
      if (device === 'wasm') configureWasm()
      
      return pipeline('text-generation', MODEL_ID, {
        device,
        dtype: DTYPE_FOR[device],
        progress_callback: (data) => {
          if (data.status !== 'progress' || data.total <= 0) return

          const percent = Math.floor((data.loaded / data.total) * 100)
          const bucket = Math.floor(percent / 10) * 10
          if (bucket > (lastLoggedPercent.get(data.file) ?? -1)) {
            lastLoggedPercent.set(data.file, bucket)
            console.log(`Generator: Downloading ${data.file}: ${bucket}%`)
            workerScope.postMessage({ type: 'progress', file: data.file, percent: bucket })
          }
        },
      })
    })()

    // Reset so failed load can be retried by a later command
    generatorPromise.catch(() => {
      generatorPromise = null
    })
  }
  return generatorPromise
}

workerScope.onmessage = async (ev) => {
  const command = ev.data

  try {
    if (command.type === 'load') {
      await getGenerator()
      return
    }

    // Generate: reuse in-flight or ready pipeline, so no re-download after preload
    const generator = await getGenerator()
    workerScope.postMessage({ type: 'generating' })

    const output = await generator(command.messages, {
      max_new_tokens: 200,
      do_sample: false,
      repetition_penalty: 1.05
      /* // < 1 is more deterministic
       * temperature: 0.3,
       * // keep tokens covering 90% of probability mass
         top_p: 0.9, 
         //
         min_p: 0.15
        */
    })

    const content = output[0].generated_text.at(-1)?.content
    if (typeof content === 'string' && content.length > 0) {
      workerScope.postMessage({ type: 'result', text: content })
    } else {
      workerScope.postMessage({ type: 'error', message: 'Model returned empty output' })
    }
  } catch (err) {
    console.error('Generator: failed', err)
    workerScope.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    })
  }
}
