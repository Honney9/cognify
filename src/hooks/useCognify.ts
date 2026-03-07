import { useState } from "react"

export function useCognify() {

  const [result, setResult] = useState<any>(null)

  async function run(type: string, input: any) {

    const worker = new Worker(
      new URL("../workers/ai.worker.ts", import.meta.url),
      { type: "module" }
    )

    worker.postMessage({ type, input })

    worker.onmessage = (e) => {

      setResult(e.data.result)
      worker.terminate()

    }

  }

  return { run, result }
}