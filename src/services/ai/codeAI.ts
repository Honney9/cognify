import { ModelManager, ModelCategory } from "@runanywhere/web";

export async function analyzeCode(code: string) {
  // ✅ Correct API
  const model = ModelManager.getLoadedModel(ModelCategory.Language);

  if (!model) {
    throw new Error("Language model not loaded");
  }

  const result = await model.run({
    prompt: `Analyze this code. Explain it, find bugs, and suggest improvements:\n\n${code}`,
    maxTokens: 512,
  });

  return {
    explanation: result.text,
    vulnerabilities: [],
    suggestions: [],
  };
}