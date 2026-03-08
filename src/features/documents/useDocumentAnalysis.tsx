import { useState } from "react"
import { analyzeContent } from "@/services/orchestrator"

export function useDocumentAnalysis() {

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyzeDocument(text: string) {

    setLoading(true)
    setError(null)

    try {

      const res = await analyzeContent("document", text)

      if (res.success) {
        setResult(res)
      } else {
        setError(res.error ?? null)
      }

    } catch (err) {

      console.error(err)
      setError("Document analysis failed")

    } finally {

      setLoading(false)

    }

  }

  return {
    analyzeDocument,
    result,
    loading,
    error
  }

}