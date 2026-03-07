import * as webllm from "@mlc-ai/web-llm"

let engine: webllm.MLCEngine | null = null

export async function loadLLM() {
  if (engine) return engine

  engine = new webllm.MLCEngine()

  await engine.reload("TinyLlama-1.1B-Chat-v1.0-q4f32_1")

  return engine
}

export async function runLLM(prompt: string) {
  const llm = await loadLLM()

  const reply = await llm.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  })

  return reply.choices[0].message.content
}