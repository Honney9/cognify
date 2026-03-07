import { useState } from "react"
import { runModel } from "@/services/ai/modelRegistry"

export function useScreenshotAnalysis() {

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function analyzeImage(file: File) {

    setLoading(true)

    try {

      const bitmap = await createImageBitmap(file)

      const res = await runModel("photo", bitmap)

      setResult(res)

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)

    }
  }

  return {
    analyzeImage,
    result,
    loading
  }
}