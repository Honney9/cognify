import { runLLM } from "./llmModel";
import { runMobileNet } from "./mobilenetModel";
import { runDeepfakeModel } from "./deepfakeModel";
import { runDocumentModel } from "./documentModel";
import { runVisionModel } from "./visionModel";

export type AIInputType = "code" | "document" | "photo" | "screenshot" | "deepfake" | "chat";

export async function runModel(type: AIInputType, input: any) {
  // Input usually contains { prompt: string, files: File[] }
  const file = input.files?.[0];

  switch (type) {
    case "chat":
      return await runLLM(input.prompt);

    case "code":
      // If there's a file, we'd normally read the text here
      const codeContext = file ? `File Content: ${file.name}` : "";
      return await runLLM(`${codeContext}\nAnalyze this request: ${input.prompt}`);

    case "document":
      if (!file) throw new Error("Document analysis requires a file.");
      return await runDocumentModel(file);

    case "photo":
    case "screenshot":
      if (!file) throw new Error("Vision analysis requires an image.");
      return await runVisionModel(file);

    case "deepfake":
      if (!file) throw new Error("Deepfake detection requires an image.");
      const mobile = await runMobileNet(file);
      const efficient = await runDeepfakeModel(file);
      return {
        mobilenet: mobile,
        efficientnet: efficient
      };

    default:
      throw new Error(`Unsupported input type: ${type}`);
  }
}