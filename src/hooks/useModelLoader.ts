import { useState } from "react"

export function useModelLoader() {

  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadModel(loader: () => Promise<any>) {

    try {

      setLoading(true)
      await loader()

      setReady(true)

    } catch (err) {

      setError((err as Error).message)

    } finally {

      setLoading(false)

    }

  }

  return {
    loading,
    ready,
    error,
    loadModel
  }

}