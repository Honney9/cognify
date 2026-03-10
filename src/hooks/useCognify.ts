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

  function detectSensitive(text: string) {

    const keywords = [
      "passport",
      "aadhaar",
      "aadhar",
      "pan card",
      "bank account",
      "credit card",
      "debit card",
      "ifsc",
      "otp",
      "cvv",
      "identity document"
    ]

    const lower = text.toLowerCase()

    return keywords.some(k => lower.includes(k))
  }

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

        const data = e.data

        // 🔐 Detect sensitive content from AI result
        const text = (data?.result ?? "").toString()

        const sensitive = detectSensitive(text)

        const enhancedResult = {
          ...data,
          sensitive
        }

        console.log("Sensitive flag:", sensitive)

        setResult(enhancedResult)
        setLoading(false)

        resolve(enhancedResult)

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