import { runLLM } from "./llmModel";

export async function runDocumentModel(file: File | Blob) {
  try {
    // 1. Extract text from the File object
    // This works inside a Worker
    const text = await file.text();

    if (!text || text.trim().length === 0) {
      throw new Error("Document is empty or could not be read.");
    }

    const prompt = `
      You are a document analysis AI.
      Analyze the following document and return a JSON object with:
      - anomalies (array of strings)
      - complianceIssues (array of strings)
      - structureScore (number 0-1)

      Document Content:
      ${text.substring(0, 5000)} // Limiting to prevent context overflow
    `;

    const response = await runLLM(prompt);

    if (!response) {
      return { anomalies: [], complianceIssues: [], structureScore: 0 };
    }

    // Try to parse JSON from LLM response
    try {
      // Find JSON block if LLM added conversational text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonToParse = jsonMatch ? jsonMatch[0] : response;
      const parsed = JSON.parse(jsonToParse);

      return {
        anomalies: parsed.anomalies || [],
        complianceIssues: parsed.complianceIssues || [],
        structureScore: parsed.structureScore || 0,
        summary: response
      };
    } catch {
      // Fallback if LLM didn't return valid JSON
      return {
        anomalies: [],
        complianceIssues: [],
        structureScore: 0.5,
        rawAnalysis: response
      };
    }
  } catch (error) {
    console.error("[DocumentModel] Error:", error);
    throw error;
  }
}