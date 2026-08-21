import { env, pipeline, type TextGenerationPipeline } from '@huggingface/transformers'

const MODEL_ID = 'onnx-community/SmolLM2-135M-Instruct-ONNX'
const DTYPE_FOR = { wasm: 'q8', webgpu: 'q4' } as const

let selectedDevice: 'webgpu' | 'wasm' | null = null
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
    console.warn('[SMOKE TEST] Not cross-origin isolated — falling back to single-threaded WASM.')
  }

  Object.assign(env.backends.onnx.wasm!, { numThreads: threads })
}

export function getDevice() { return selectedDevice }

const lastLoggedPercent = new Map<string, number>()

export function getGenerator(): Promise<TextGenerationPipeline> {
  if (!generatorPromise) {
    generatorPromise = (async () => {
      const device = await detectDevice()
      selectedDevice = device
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
            console.log(`[SMOKE TEST] Downloading ${data.file}: ${bucket}%`)
          }
        },
      })
    })()
  }
  return generatorPromise
}
