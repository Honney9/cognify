import { runModel } from "@/services/ai/modelRegistry"

self.onmessage = async (event: MessageEvent) => {

  const { type, input } = event.data

  try {

    const result = await runModel(type, input)

    self.postMessage({
      success: true,
      result
    })

  } catch (error) {

    self.postMessage({
      success: false,
      error: (error as Error).message
    })

  }

}