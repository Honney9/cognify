import { runLLM } from "./llmModel";

export async function runDocumentModel(file: File | Blob) {
  try {
    const text = await file.text();

    if (!text || text.trim().length === 0) {
      throw new Error("Document is empty or could not be read.");
    }

    // ADVANCED PROMPT ENGINEERING:
    // Uses Role-Task-Constraint framework and explicit JSON schema definition
    const prompt = `
      ### ROLE
      You are a Professional Document Auditor specialized in structural integrity and regulatory compliance.

      ### TASK
      Analyze the provided document text for anomalies (logical inconsistencies, missing sections), 
      compliance issues (legal or formatting standard violations), and overall structural quality.

      ### INPUT DATA
      <document_text>
      ${text.substring(0, 6000)} 
      </document_text>

      ### OUTPUT REQUIREMENTS
      - Return ONLY a valid JSON object. 
      - Do not include any introductory text or markdown explanations outside the JSON.
      - If no issues are found, return empty arrays.
      - "structureScore" must be a float between 0.0 and 1.0.

      ### JSON SCHEMA
      {
        "anomalies": ["string"],
        "complianceIssues": ["string"],
        "structureScore": number,
        "summary": "string (concise executive summary)"
      }
    `;

    const response = await runLLM(prompt);

    if (!response) {
      return { anomalies: [], complianceIssues: [], structureScore: 0, summary: "No response from model." };
    }

    try {
      // ADVANCED PARSING: 
      // Handles cases where LLMs wrap JSON in markdown code blocks
      const cleanJson = response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
        
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleanJson);

      return {
        anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
        complianceIssues: Array.isArray(parsed.complianceIssues) ? parsed.complianceIssues : [],
        structureScore: typeof parsed.structureScore === 'number' ? parsed.structureScore : 0.5,
        summary: parsed.summary || response.substring(0, 200)
      };
    } catch (parseError) {
      console.warn("[DocumentModel] JSON Parse failed, falling back to raw analysis.", parseError);
      return {
        anomalies: [],
        complianceIssues: [],
        structureScore: 0.5,
        summary: "Analysis completed but format was irregular.",
        rawAnalysis: response
      };
    }
  } catch (error) {
    console.error("[DocumentModel] Error:", error);
    throw error;
  }
}