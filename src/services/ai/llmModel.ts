import * as webllm from "@mlc-ai/web-llm";

let engine: webllm.MLCEngine | null = null;
let loadingPromise: Promise<webllm.MLCEngine> | null = null;

const MODEL_ID = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC";

export async function loadLLM(onProgress?: (report: any) => void): Promise<webllm.MLCEngine> {
  // If engine exists but crashed, reset it
  if (engine) return engine;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const initProgressCallback = (report: any) => {
        onProgress?.(report);
      };

      engine = new webllm.MLCEngine({
        appConfig: webllm.prebuiltAppConfig,
        initProgressCallback
      });

      // NEW: Error listener to reset the engine if the GPU crashes again
      // @ts-ignore - access internal device for health checks
      if (engine.device) {
        // @ts-ignore
        engine.device.lost.then((info: any) => {
          console.error("[LLM] WebGPU Device lost:", info.message);
          engine = null;
          loadingPromise = null;
        });
      }

      await engine.reload(MODEL_ID);
      return engine;
    } catch (error) {
      engine = null;
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
}

export async function runLLM(prompt: string): Promise<string> {
  try {
    const llm = await loadLLM();
    const reply = await llm.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0,
      max_tokens: 512
    });
    return reply?.choices?.[0]?.message?.content ?? "No response.";
  } catch (error) {
    // If inference fails because of GPU, reset engine state
    engine = null;
    loadingPromise = null;
    throw error;
  }
}