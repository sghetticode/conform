import { pipeline, type TextGenerationPipeline } from '@huggingface/transformers'

let generatorPromise: Promise<TextGenerationPipeline> | null = null

export function getGenerator(): Promise<TextGenerationPipeline> {
  if (!generatorPromise) {
    generatorPromise = pipeline(
      'text-generation',
      'onnx-community/Qwen2.5-0.5B-Instruct',
      { dtype: 'q4' },
    )
  }
  return generatorPromise
}