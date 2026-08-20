import { pipeline, type TextGenerationPipeline } from '@huggingface/transformers'

let generatorPromise: Promise<TextGenerationPipeline> | null = null
const lastLoggedPercent = new Map<string, number>()

export function getGenerator(): Promise<TextGenerationPipeline> {
  if (!generatorPromise) {
    generatorPromise = pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX', {
      dtype: 'q8',
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
  }
  return generatorPromise
}
