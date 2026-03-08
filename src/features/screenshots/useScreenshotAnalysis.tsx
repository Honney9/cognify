import { useState } from "react"
import { analyzeContent } from "@/services/orchestrator"

export function useScreenshotAnalysis() {

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyzeImage(file: File) {

    setLoading(true)
    setError(null)

    try {

      const res = await analyzeContent("screenshot", file)

      if (res.success) {
        setResult(res)
      } else {
        setError(res.error ?? null)
      }

    } catch {

      setError("Screenshot analysis failed")

    } finally {

      setLoading(false)

    }

  }

  return {
    analyzeImage,
    result,
    loading,
    error
  }

}