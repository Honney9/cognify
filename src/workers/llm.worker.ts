import { runLLM } from "@/services/ai/llmModel"

self.onmessage = async (event: MessageEvent) => {

  const { prompt } = event.data

  try {

    const result = await runLLM(prompt)

    self.postMessage({
      success: true,
      result
    })

  } catch (err) {

    self.postMessage({
      success: false,
      error: (err as Error).message
    })

  }

}