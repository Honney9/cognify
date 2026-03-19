import { runLLM } from "./llmModel";
import { runMobileNet } from "./mobilenetModel";
import { runDeepfakeModel } from "./deepfakeModel";
import { runDocumentModel } from "./documentModel";
import { runVisionModel } from "./visionModel";

// 🔥 import your smart pipeline
import {
  detectIntent,
  generatePrompt,
  extractJSON,
  validatePhotoResponse
} from "./photoAnalysisService";
import { parse } from "date-fns";

export type AIInputType = "code" | "document" | "photo" | "deepfake" | "chat";

export async function runModel(type: AIInputType, input: any) {
  const file = input.files?.[0];
  const prompt = input.prompt || "";

  /* ------------------------------
     🔥 IMAGE PIPELINE (SMART)
  ------------------------------ */

  if (file && file.type.startsWith("image/")) {

    // 1. Run vision model
    const visionResult = await runVisionModel(file);

    // 2. Detect intent from prompt
    const intent = detectIntent(prompt);

    // 🔥 If deepfake explicitly requested
    if (intent === "deepfake") {
      const mobile = await runMobileNet(file);
      const efficient = await runDeepfakeModel(file);

      return {
        type: "deepfake_detection",
        isDeepfake: efficient.isDeepfake,
        confidence: efficient.confidence,
        analysis: "Deepfake detection performed using ensemble models."
      };
    }

    // 🔥 If document explicitly requested
    if (intent === "document") {
      return await runDocumentModel(file);
    }

    // 3. Build context for LLM
    const modelContext = {
      objects: visionResult.detectedObjects || [],
      scene: visionResult.scene || "unknown",
      imageType: visionResult.meta?.imageType || "unknown",

      hints: {
        objectCount: visionResult.detectedObjects?.length || 0,
        isNature: visionResult.detectedObjects?.some((o: string) =>
          ["tree", "mountain", "river", "sky"].includes(o)
        )
      }
    };

    // 4. Generate LLM prompt
    const llmPrompt = generatePrompt(intent, prompt, modelContext);

    // 5. Run LLM
    const llmResponse = await runLLM(llmPrompt);

    // 6. Extract + validate
    const parsed = extractJSON(llmResponse);

    console.log("Final Backend Response", parsed);

    return validatePhotoResponse(parsed);
  }

  /* ------------------------------
     🔥 NON-IMAGE ROUTES
  ------------------------------ */

  switch (type) {
    case "chat":
      return await runLLM(prompt);

    case "code":
      const codeContext = file ? `File Content: ${file.name}` : "";
      return await runLLM(`${codeContext}\nAnalyze this request: ${prompt}`);

    case "document":
      if (!file) throw new Error("Document analysis requires a file.");
      return await runDocumentModel(file);

    case "photo":
      throw new Error("Photo analysis requires an image.");

    case "deepfake":
      throw new Error("Deepfake detection requires an image.");

    default:
      throw new Error(`Unsupported input type: ${type}`);
  }
}