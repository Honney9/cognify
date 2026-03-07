import { runMobileNet } from "@/services/ai/mobilenetModel"
import { runDeepfakeModel } from "@/services/ai/deepfakeModel"

self.onmessage = async (event: MessageEvent) => {

  const { image } = event.data

  try {

    const mobile = await runMobileNet(image)
    const efficient = await runDeepfakeModel(image)

    self.postMessage({
      success: true,
      result: {
        mobilenet: mobile,
        efficientnet: efficient
      }
    })

  } catch (err) {

    self.postMessage({
      success: false,
      error: (err as Error).message
    })

  }

}