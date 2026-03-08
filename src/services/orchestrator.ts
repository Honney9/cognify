import { runLLM } from "./ai/llmModel";
import { runMobileNet } from "./ai/mobilenetModel";
import { runDeepfakeModel } from "./ai/deepfakeModel";
import { runVisionModel } from "./ai/visionModel";
import { AIInputType } from "./ai/modelRegistry";
import { processDocument, isDocumentProcessingRequest } from "./document/processor";

export async function analyzeContent(
  type: AIInputType,
  input: { prompt: string; files: File[] }
) {
  try {
    let modelResult: any = null;
    let reasoning: string | null = null;
    let currentType = type; // Use a local variable we can change if detection fails
    const file = input.files?.[0];

    // 1. Document processing logic (with automatic fallback to Photo mode)
    if (currentType === "document" && file) {
      try {
        const documentResult = await processDocument(file, input.prompt);
        
        // If successful, return the document result immediately
        return {
          success: true,
          documentResult,
          reasoning: JSON.stringify(documentResult)
        };
      } catch (error: any) {
        console.error("Document processing error:", error);
        
        const errorMsg = error.message || "";
        
        // CHECK: Is this a fake PDF (actually an image) or a scanned document?
        const isActuallyImage = 
          errorMsg.includes("IMAGE_FILE") || 
          errorMsg.includes("image renamed to .pdf") || 
          errorMsg.includes("scanned image");

        if (isActuallyImage) {
          console.warn("PDF contains image data. Redirecting to Vision models...");
          currentType = "photo"; // Switch type and let execution continue to the photo block
        } else {
          // For true corruptions or unhandled errors, fall back to LLM explanation
          const fallbackReasoning = await runLLM(
            `I encountered an error reading this document: "${errorMsg}". 
             The user wanted: "${input.prompt}". Please explain the issue politely.`
          );
          return { success: false, error: errorMsg, reasoning: fallbackReasoning };
        }
      }
    }

    // 2. Specialized logic for Photo analysis (or redirected documents)
    if (currentType === "photo" && file) {
      // Call models directly
      const [visionData, mobileData, deepfakeData] = await Promise.all([
        runVisionModel(file),
        runMobileNet(file),
        runDeepfakeModel(file)
      ]);

      modelResult = { visionData, mobileData, deepfakeData };

      // Short delay to manage GPU/WASM context switching
      await new Promise(resolve => setTimeout(resolve, 500));

      // Prepare visual context
      const context = JSON.stringify({
        fileName: file.name,
        visionFeatures: visionData,
        classifierResult: mobileData?.label || "unknown",
        isDeepfake: deepfakeData?.isDeepfake || false
      });

      const isDeepfakeQuery = input.prompt.toLowerCase().includes("deepfake") || 
                              input.prompt.toLowerCase().includes("ai generated");

      let prompt = "";
      if (isDeepfakeQuery) {
        prompt = `Task: Deepfake Detection. Data: ${context}. Respond ONLY with JSON. Format: {"type":"deepfake_detection","isDeepfake":boolean,"confidence":number,"analysis":string}`;
      } else {
        prompt = `Task: Photo/Visual Analysis. 
        Visual Data: ${context}. 
        User Request: "${input.prompt}".
        
        Rules:
        1. If the file name looks like a document (e.g., marksheet.pdf), analyze the text/data described in visualFeatures.
        2. Identify the scene (Nature, Urban, Document, Presentation, etc.).
        3. Respond ONLY with valid JSON.
        Format: {
          "type": "photo_analysis",
          "summary": "Detailed description of contents",
          "scene": "Category",
          "detectedObjects": ["list"],
          "confidence": 0.9
        }`;
      }
      
      const llmResponse = await runLLM(prompt);
      
      // JSON extraction
      if (llmResponse) {
        const start = llmResponse.indexOf('{');
        const end = llmResponse.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          reasoning = llmResponse.substring(start, end + 1);
        } else {
          reasoning = llmResponse;
        }
      }
    } 
    else {
      // General chat fallback
      reasoning = await runLLM(`Context: ${currentType}. User: ${input.prompt}`);
    }

    return {
      success: true,
      modelOutput: modelResult,
      reasoning: reasoning || "Analysis complete."
    };
  } catch (error) {
    console.error("Orchestrator error:", error);
    return { success: false, error: String(error) };
  }
}