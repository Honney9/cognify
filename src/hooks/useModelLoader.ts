import { useState } from "react"
import { ModelManager, ModelCategory } from "@runanywhere/web"

export type LoaderState =
  | "idle"
  | "downloading"
  | "loading"
  | "ready"
  | "error"

export function useModelLoader(category: ModelCategory) {

  const [state, setState] = useState<LoaderState>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function ensure() {

    try {

      const loaded = ModelManager.getLoadedModel(category)

      if (loaded) {
        setState("ready")
        return true
      }

      const models = ModelManager
        .getModels()
        .filter(m => m.modality === category)

      if (models.length === 0) {
        setError("No model registered")
        setState("error")
        return false
      }

      const model = models[0]

      if (model.status !== "downloaded" && model.status !== "loaded") {

        setState("downloading")

        await ModelManager.downloadModel(model.id)

        setProgress(1)
      }

      setState("loading")

      const ok = await ModelManager.loadModel(model.id)

      if (ok) {
        setState("ready")
        return true
      }

      setState("error")
      return false

    } catch (err) {

      setError((err as Error).message)
      setState("error")
      return false

    }

  }

  return { state, progress, error, ensure }

}