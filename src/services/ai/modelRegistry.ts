import { runLLM } from "./llmModel"
import { runMobileNet } from "./mobilenetModel"
import { runDeepfakeModel } from "./deepfakeModel"
import { runDocumentModel } from "./documentModel"
import { runVisionModel } from "./visionModel"

export type AIInputType =
  | "code"
  | "document"
  | "photo"
  | "screenshot"
  | "deepfake"
  | "chat"

export async function runModel(type: AIInputType, input: any) {

  switch (type) {

    case "chat":
      return runLLM(input)

    case "code":
      return runLLM(`Analyze this code:\n${input}`)

    case "document":
      return runDocumentModel(input)

    case "photo":
    case "screenshot":
      return runVisionModel(input)

    case "deepfake":
      const mobile = await runMobileNet(input)
      const efficient = await runDeepfakeModel(input)

      return {
        mobilenet: mobile,
        efficientnet: efficient
      }

    default:
      throw new Error("Unsupported input type")
  }
}