import { runLLM } from "./ai/llmModel"
import { runMobileNet } from "./ai/mobilenetModel"
import { runDeepfakeModel } from "./ai/deepfakeModel"
import { runVisionModel } from "./ai/visionModel"
import { AIInputType } from "./ai/modelRegistry"
import { processDocument } from "./document/processor"
import { analyzeCode } from "./ai/codeAnalysisService"

import { 
  detectIntent,
  generatePrompt,
  extractJSON,
  validatePhotoResponse
} from "./ai/photoAnalysisService";


export async function analyzeContent(
  type: AIInputType,
  input: { prompt: string; files: File[] }
) {

  try {

    let modelResult: any = null
    let reasoning: string | null = null
    let currentType = type

    const file = input.files?.[0]
    const promptLower = input.prompt.toLowerCase()

    /**
     * Detect deepfake related queries
     */
    const isDeepfakeQuery =
      promptLower.includes("deepfake") ||
      promptLower.includes("fake") ||
      promptLower.includes("ai generated") ||
      promptLower.includes("synthetic")

    /**
     * 1️⃣ Document Processing
     */
    if (currentType === "document" && file) {

      try {

        const documentResult = await processDocument(file, input.prompt)

        return {
          success: true,
          documentResult,
          reasoning: JSON.stringify(documentResult)
        }

      } catch (error: any) {

        console.error("Document processing error:", error)

        const errorMsg = error.message || ""

        const isActuallyImage =
          errorMsg.includes("IMAGE_FILE") ||
          errorMsg.includes("image renamed to .pdf") ||
          errorMsg.includes("scanned image")

        if (isActuallyImage) {

          console.warn("Document is actually an image. Switching to photo mode.")
          currentType = "photo"

        } else {

          const fallback = await runLLM(`
Explain politely why the document could not be processed.

Error:
${errorMsg}

User request:
${input.prompt}
`)

          return {
            success: false,
            error: errorMsg,
            reasoning: String(fallback)
          }
        }
      }
    }

    /**Code Analysis*/
  if (currentType === "code") {

    const code = input.prompt

    const result = await analyzeCode(input.prompt, code)

    return {
      success: true,
      modelOutput: result,
      reasoning: result
    }
  }
    /**Photo Analysis*/
    if (currentType === "photo" && file) {

  const intent = detectIntent(input.prompt)

  let modelContext: any = {}

  /** Deepfake detection*/
  if (intent === "deepfake") {

    const deepfakeData = await runDeepfakeModel(file)

    modelContext = {
      isDeepfake: deepfakeData?.isDeepfake,
      confidence: deepfakeData?.confidence
    }

    const prompt = generatePrompt(intent, input.prompt, modelContext)
    const llmResponse = await runLLM(prompt)

    const parsed = extractJSON(llmResponse)

    return {
      success: true,
      modelOutput: deepfakeData,
      reasoning: parsed
    }
  }

  /**
   * 2️⃣ Content tagging
   */
  if (intent === "tagging") {

    const mobileData = await runMobileNet(file)

    modelContext = {
      classifierResult: mobileData?.label || "unknown"
    }

    const prompt = generatePrompt(intent, input.prompt, modelContext)
    const llmResponse = await runLLM(prompt)

    const parsed = extractJSON(llmResponse)
    const validated = validatePhotoResponse(parsed)

    return {
      success: true,
      modelOutput: mobileData,
      reasoning: validated
    }
  }

  /**
   * 3️⃣ Scene understanding
   */
  if (intent === "scene") {

    const visionData = await runVisionModel(file)

    modelContext = {
      visionFeatures: visionData
    }

    const prompt = generatePrompt(intent, input.prompt, modelContext)
    const llmResponse = await runLLM(prompt)

    const parsed = extractJSON(llmResponse)
    const validated = validatePhotoResponse(parsed)

    return {
      success: true,
      modelOutput: visionData,
      reasoning: validated
    }
  }

  /**
   * 4️⃣ General analysis (runs all models)
   */
  const visionData = await runVisionModel(file)
  const mobileData = await runMobileNet(file)
  const deepfakeData = await runDeepfakeModel(file)

  modelContext = {
    visionFeatures: visionData,
    classifierResult: mobileData?.label || "unknown",
    isDeepfake: deepfakeData?.isDeepfake
  }

  const prompt = generatePrompt("general", input.prompt, modelContext)
  const llmResponse = await runLLM(prompt)

  const parsed = extractJSON(llmResponse)
  const validated = validatePhotoResponse(parsed)

  return {
    success: true,
    modelOutput: modelContext,
    reasoning: validated
  }
}

    /**
     * 3️⃣ General AI Chat
     */
    if (!reasoning) {

      const response = await runLLM(`
Context type: ${currentType}

User request:
${input.prompt}

Provide a helpful response.
`)

      reasoning = String(response)
    }

    return {
      success: true,
      modelOutput: modelResult,
      reasoning: reasoning || "Analysis complete."
    }

  } catch (error) {

    console.error("Orchestrator error:", error)

    return {
      success: false,
      error: String(error)
    }
  }
}