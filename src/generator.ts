import type { Message } from '@huggingface/transformers'
import { factors, factorNames, type FactorResults } from './factors'

export type ProgressHandler = (status: string) => void

type WorkerEvent =
  | { type: 'progress'; file: string; percent: number }
  | { type: 'generating' }
  | { type: 'result'; text: string }
  | { type: 'error'; message: string }

let worker: Worker | null = null
let progressHandler: ProgressHandler | null = null
let pendingResolve: ((text: string) => void) | null = null
let pendingReject: ((err: Error) => void) | null = null

function settle() {
  pendingResolve = null
  pendingReject = null
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./generator.worker.ts', import.meta.url), { type: 'module' })

    worker.addEventListener('message', (ev: MessageEvent<WorkerEvent>) => {
      const event = ev.data

      switch (event.type) {
        case 'progress':
          progressHandler?.(`Downloading model... ${event.percent}%`)
          break
        case 'generating':
          progressHandler?.('Generating description...')
          break
        case 'result':
          pendingResolve?.(event.text)
          settle()
          break
        case 'error':
          if (pendingReject) {
            pendingReject(new Error(event.message))
            settle()
          } else {
            // Preload failure with no pending request
            console.error('Generator:', event.message)
          }
          break
      }
    })
  }

  return worker
}

// Kick off model download to load in background
export function preloadGenerator() {
  getWorker().postMessage({ type: 'load' })
}

// Generate a personality description from trait test results
export function generateDescription(
  results: FactorResults,
  onProgress: ProgressHandler,
): Promise<string> {
  return new Promise((resolve, reject) => {
    pendingReject?.(new Error('Superseded by a new generation request'))

    pendingResolve = resolve
    pendingReject = reject
    progressHandler = onProgress

    const percentages = factors
      .map((factor) => `${factorNames[factor]}: ${Math.round(results[factor].percentage)}%`)
      .join('\n')

    const messages: Message[] = [
      {
        role: 'system',
        content:
          "Use the percentages of each factor from the trait test to write a personality description.",
      },
      { role: 'user', content: percentages },
    ]

    onProgress('Preparing model...')
    getWorker().postMessage({ type: 'generate', messages })
  })
}
