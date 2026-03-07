import { useState } from "react"
import { runModel } from "@/services/ai/modelRegistry"

export function useCodeAnalysis() {

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function analyzeCode(code: string) {

    setLoading(true)

    try {
      const res = await runModel("code", code)
      setResult(res)
    } 
    catch (err) {
      console.error(err)
    } 
    finally {
      setLoading(false)
    }
  }

  return {
    analyzeCode,
    result,
    loading
  }
}