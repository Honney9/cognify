import { useState } from "react"

type CognifyPayload = {
  type: string | null
  prompt: string
  files: File[]
}

export function useCognify() {

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze(payload: CognifyPayload) {

    setLoading(true)
    setError(null)

    return new Promise((resolve, reject) => {

      const worker = new Worker(
        new URL("../workers/ai.worker.ts", import.meta.url),
        { type: "module" }
      )

      worker.postMessage(payload)

      worker.onmessage = (e) => {

        setResult(e.data)
        setLoading(false)

        resolve(e.data)

        worker.terminate()
      }

      worker.onerror = (err) => {

        setError("AI worker failed")
        setLoading(false)

        reject(err)

        worker.terminate()
      }

    })

  }

  return {
    analyze,
    result,
    loading,
    error
  }

}