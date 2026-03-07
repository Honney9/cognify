import { useState } from "react"

export function useLLM() {

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function run(prompt: string) {

    setLoading(true)

    const worker = new Worker(
      new URL("../workers/llm.worker.ts", import.meta.url),
      { type: "module" }
    )

    worker.postMessage({ prompt })

    worker.onmessage = (e) => {
      setResult(e.data.result)
      setLoading(false)
      worker.terminate()
    }

  }

  return { run, loading, result }
}