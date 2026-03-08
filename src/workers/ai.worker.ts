import { analyzeContent } from "../services/orchestrator";

/**
 * Main message listener for the background thread.
 * It receives tasks from the UI and passes them to the Orchestrator.
 */
self.onmessage = async (e: MessageEvent) => {
  const { type, prompt, files } = e.data;
  
  try {
    console.log(`[LLM Worker] Processing ${type} task...`);

    // The Orchestrator calls runLLM inside llmModel.ts
    const result = await analyzeContent(type, { prompt, files });
    
    self.postMessage({
      success: result.success,
      result: result.success ? (result.reasoning || "Analysis complete.") : null,
      error: !result.success ? result.error : null,
      modelOutput: result.modelOutput
    });
  } catch (error) {
    console.error("[LLM Worker Task Error]", error);
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : "Internal AI Worker Error"
    });
  }
};