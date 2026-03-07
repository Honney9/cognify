import { runModel } from "./ai/modelRegistry"
import { runLLM } from "./ai/llmModel"

type ContentType =
  | "code"
  | "document"
  | "screenshot"
  | "photo"

export async function analyzeContent(
  type: ContentType,
  input: any
) {

  try {

    let modelResult: any
    let reasoning: string | null = null

    // Run the appropriate ML model
    modelResult = await runModel(type, input)

    // Optional LLM reasoning layer
    if (type === "code" || type === "document") {

      reasoning = await runLLM(`
      Analyze the following AI output and explain it clearly.

      ${JSON.stringify(modelResult)}

      Provide:
      - summary
      - risks
      - improvements
      `)

    }

    if (type === "screenshot") {

      reasoning = await runLLM(`
      Based on this screenshot analysis:

      ${JSON.stringify(modelResult)}

      Identify:
      - sensitive data
      - privacy risks
      - recommended actions
      `)

    }

    if (type === "photo") {

      reasoning = await runLLM(`
      Based on detected objects:

      ${JSON.stringify(modelResult)}

      Determine the scene such as:
      - birthday celebration
      - meeting
      - study session
      - travel

      Provide scene explanation.
      `)

    }

    return {
      success: true,
      modelOutput: modelResult,
      reasoning
    }

  } catch (error) {

    return {
      success: false,
      error: String(error)
    }

  }

}