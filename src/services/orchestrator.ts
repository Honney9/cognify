import { runLLM } from "./ai/llmModel";
import { runMobileNet } from "./ai/mobilenetModel";
import { runDeepfakeModel } from "./ai/deepfakeModel";
import { runVisionModel } from "./ai/visionModel";
import { AIInputType } from "./ai/modelRegistry";

export async function analyzeContent(
  type: AIInputType,
  input: { prompt: string; files: File[] }
) {
  try {
    let modelResult: any = null;
    let reasoning: string | null = null;
    const file = input.files?.[0];

    // Specialized logic for Photo analysis
    if (type === "photo" && file) {
      // Call models directly to avoid registry reference errors
      const [visionData, mobileData, deepfakeData] = await Promise.all([
        runVisionModel(file),
        runMobileNet(file),
        runDeepfakeModel(file)
      ]);

      modelResult = { visionData, mobileData, deepfakeData };

      // Short delay to manage GPU/WASM context switching
      await new Promise(resolve => setTimeout(resolve, 500));

      // Prepare a clean context string for the LLM
      const context = JSON.stringify({
        visionFeatures: visionData,
        classifierResult: mobileData?.label || "unknown",
        isDeepfake: deepfakeData?.isDeepfake || false
      });

      const isDeepfakeQuery = input.prompt.toLowerCase().includes("deepfake") || 
                              input.prompt.toLowerCase().includes("ai generated");

      let prompt = "";
      if (isDeepfakeQuery) {
        prompt = `Task: Deepfake Detection. 
        Data: ${context}. 
        Respond ONLY with JSON.
        Format: {"type":"deepfake_detection","isDeepfake":boolean,"confidence":number,"analysis":string}`;
      } else {
        // FIX: Improved prompt for generalization and reducing bias
        prompt = `Task: General Photo Analysis. 
        Visual Data: ${context}. 
        User Request: "${input.prompt}".
        
        Rules for Analysis:
        1. Identify the broad scene category (e.g., Nature, Urban, Presentation, Interior).
        2. DO NOT default to 'Celebration' unless flowers/party items are explicitly the main focus.
        3. If railroad tracks, trees, or sky are detected, categorize as 'Nature' or 'Transportation'.
        4. If people are at a podium or in a meeting room, categorize as 'Presentation'.
        5. Generalize based on visual cues for any unseen scene types.

        Respond ONLY with valid JSON.
        Format: {
          "type": "photo",
          "summary": "Clear description of the scene",
          "scene": "Broad Category",
          "detectedObjects": ["list of items"],
          "tags": ["relevant", "tags"],
          "confidence": 0.9
        }`;
      }
      
      const llmResponse = await runLLM(prompt);
      
      // Robust JSON extraction
      if (llmResponse) {
        const start = llmResponse.indexOf('{');
        const end = llmResponse.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          reasoning = llmResponse.substring(start, end + 1);
        }
      }
    } 
    else {
      // Fallback for general chat or unhandled types
      reasoning = await runLLM(`Context: ${type}. User: ${input.prompt}`);
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