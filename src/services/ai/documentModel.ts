import { runLLM } from "./llmModel"

export async function runDocumentModel(text: string) {

  const prompt = `
You are a document analysis AI.

Analyze the following document and return JSON with:
- anomalies
- complianceIssues
- structureScore

Document:
${text}
`

  const response = await runLLM(prompt)

  if (!response) {
    return {
      anomalies: [],
      complianceIssues: [],
      structureScore: 0
    }
  }

  try {

    const parsed = JSON.parse(response)

    return {
      anomalies: parsed.anomalies || [],
      complianceIssues: parsed.complianceIssues || [],
      structureScore: parsed.structureScore || 0
    }

  } catch {

    return {
      anomalies: [],
      complianceIssues: [],
      structureScore: 0.5,
      rawAnalysis: response
    }

  }
}