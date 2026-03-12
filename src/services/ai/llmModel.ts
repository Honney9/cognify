import * as webllm from "@mlc-ai/web-llm";

let engine: webllm.MLCEngine | null = null;

async function loadModel() {

  if (!engine) {


    console.log("[LLM] Loading WebLLM...");

    const appConfig = webllm.prebuiltAppConfig;

    engine = new webllm.MLCEngine({
      appConfig,
      logLevel: "INFO"
    });

    await engine.reload("Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC");

    console.log("[LLM] Model loaded");
  }

  return engine;
}

export async function runLLM(prompt: string): Promise<string> {

  try {

    const model = await loadModel();

    const response = await model.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant used inside a productivity app. You analyze computer vision outputs and respond strictly in JSON when requested."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

    return response.choices[0]?.message?.content || "No response";

  } catch (error) {

    console.error("LLM error:", error);

    return "LLM failed to generate response.";
  }
}