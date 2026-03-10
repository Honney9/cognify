import { runLLM } from "./ai/llmModel";
import { runMobileNet } from "./ai/mobilenetModel";
import { runDeepfakeModel } from "./ai/deepfakeModel";
import { runVisionModel } from "./ai/visionModel";
import { AIInputType } from "./ai/modelRegistry";
import { processDocument } from "./document/processor";

/**
 * Safely extract JSON from LLM output
 */
function extractJSON(text: string | null): string | null {
  if (!text) return null;

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return text;

    const parsed = JSON.parse(match[0]);
    return JSON.stringify(parsed);
  } catch {
    return text;
  }
}

export async function analyzeContent(
  type: AIInputType,
  input: { prompt: string; files: File[] }
) {
  try {

    let modelResult: any = null;
    let reasoning: string | null = null;
    let currentType = type;

    const file = input.files?.[0];

    /**
     * 1️⃣ Document Processing
     */
    if (currentType === "document" && file) {

      try {

        const documentResult = await processDocument(file, input.prompt);

        return {
          success: true,
          documentResult,
          reasoning: JSON.stringify(documentResult)
        };

      } catch (error: any) {

        console.error("Document processing error:", error);

        const errorMsg = error.message || "";

        const isActuallyImage =
          errorMsg.includes("IMAGE_FILE") ||
          errorMsg.includes("image renamed to .pdf") ||
          errorMsg.includes("scanned image");

        if (isActuallyImage) {

          console.warn("Document contains image data. Redirecting to Photo analysis...");
          currentType = "photo";

        } else {

          const fallbackReasoning = await runLLM(
            `Explain politely why the document could not be processed.

Error: ${errorMsg}

User request: ${input.prompt}`
          );

          return {
            success: false,
            error: errorMsg,
            reasoning: fallbackReasoning
          };
        }
      }
    }

    /**
     * 2️⃣ Photo Analysis
     */
    if (currentType === "photo" && file) {

      const [visionData, mobileData, deepfakeData] = await Promise.all([
        runVisionModel(file),
        runMobileNet(file),
        runDeepfakeModel(file)
      ]);

      modelResult = {
        visionData,
        mobileData,
        deepfakeData
      };

      const context = JSON.stringify({
        fileName: file.name,
        visionFeatures: visionData,
        classifier: mobileData?.label || "unknown",
        deepfakeScore: deepfakeData
      });

      const isDeepfakeQuery =
        input.prompt.toLowerCase().includes("deepfake") ||
        input.prompt.toLowerCase().includes("ai generated");

      let prompt = "";

      if (isDeepfakeQuery) {

        prompt = `
You are an AI deepfake detection system.

Image Data:
${context}

Return ONLY valid JSON.

{
"type": "deepfake_detection",
"isDeepfake": true or false,
"confidence": 0.0,
"analysis": "short explanation"
}
`;

      } else {

        prompt = `
You are an AI visual analysis system.

Image Data:
${context}

User Request:
${input.prompt}

Return ONLY valid JSON.

{
"type": "photo_analysis",
"summary": "description of the image",
"scene": "category",
"detectedObjects": [],
"confidence": 0.0
}
`;
      }

      const llmResponse = await runLLM(prompt);

      reasoning = extractJSON(String(llmResponse));
    }

    /**
     * 3️⃣ General Chat / Analysis
     */
    else {

      const response = await runLLM(`
Context: ${currentType}

User:
${input.prompt}

Provide a clear helpful answer.
`);

      reasoning = String(response);
    }

    return {
      success: true,
      modelOutput: modelResult,
      reasoning: reasoning || "Analysis complete."
    };

  } catch (error) {

    console.error("Orchestrator error:", error);

    return {
      success: false,
      error: String(error)
    };
  }
}
