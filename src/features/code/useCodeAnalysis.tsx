import { useState } from "react"
import { analyzeContent } from "@/services/orchestrator"

export function useCodeAnalysis() {

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyzeCode(code: string) {

    setLoading(true)
    setError(null)

    try {

      const res = await analyzeContent("code", code)

      setResult(res)

    } catch (err) {

      console.error(err)
      setError("Code analysis failed")

    } finally {

      setLoading(false)

    }

  }

  return {
    analyzeCode,
    result,
    loading,
    error
  }

}