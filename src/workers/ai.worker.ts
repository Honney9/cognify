import * as webllm from "@mlc-ai/web-llm"

let engine: webllm.MLCEngine | null = null
let loadingPromise: Promise<webllm.MLCEngine> | null = null

export async function loadLLM(onProgress?: (report: any) => void): Promise<webllm.MLCEngine> {

  if (engine) return engine
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {

    try {

      console.log("[LLM] Starting to load model...")

      const initProgressCallback = (report: any) => {
        console.log("[LLM] Loading progress:", report)
        onProgress?.(report)
      }

      engine = new webllm.MLCEngine({
        initProgressCallback
      })

      const modelId = "TinyLlama-1.1B-Chat-v1.0-q4f16_1"

      console.log("[LLM] Loading model:", modelId)

      await engine.reload(modelId)

      console.log("[LLM] Model loaded successfully!")

      return engine

    } catch (error) {

      console.error("[LLM] Failed to load model:", error)

      engine = null
      loadingPromise = null

      throw error

    }

  })()

  return loadingPromise
}

export async function runLLM(prompt: string): Promise<string> {

  try {

    if (!prompt || typeof prompt !== "string") {
      throw new Error("Invalid prompt: must be a non-empty string")
    }

    const llm = await loadLLM()

    console.log("[LLM] Running inference...")

    const reply = await llm.chat.completions.create({

      messages: [
        {
          role: "user",
          content: prompt
        }
      ]

    })

    const response = reply?.choices?.[0]?.message?.content ?? "No response generated."

    console.log("[LLM] Response:", response.substring(0, 100))

    return response

  } catch (error) {

    console.error("[LLM] Error in runLLM:", error)

    throw error

  }

}