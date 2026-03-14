import { runLLM } from "../ai/llmModel";

export type CodeIntent =
  | "summarize"
  | "explain"
  | "bug_detection"
  | "optimization"
  | "convert"
  | "general";

export type CodeAnalysisResponse = {
  success: boolean;
  type: "code";
  summary?: string;
  explanation?: string;
  bugs?: string[];
  vulnerabilities?: string[];
  suggestions?: string[];
  optimizedCode?: string;
  convertedCode?: string;
};

/* -------------------------
Intent Detection
------------------------- */

export function detectCodeIntent(prompt: string): CodeIntent {
  const p = prompt.toLowerCase();

  if (p.includes("summarize")) return "summarize";
  if (p.includes("explain")) return "explain";
  if (p.includes("bug") || p.includes("error") || p.includes("vulnerability"))
    return "bug_detection";
  if (p.includes("optimize") || p.includes("improve"))
    return "optimization";
  if (p.includes("convert") || p.includes("translate") || p.includes("rewrite"))
    return "convert";

  return "general";
}

/* -------------------------
Prompt Generator
Shorter prompt to avoid token overflow
------------------------- */

export function generateCodePrompt(
  intent: CodeIntent,
  userPrompt: string,
  code: string
): string {

  return `
You are an AI code assistant.

User request:
${userPrompt}

Code:
${code}

Respond ONLY with JSON.

Format:

{
 "type":"code",
 "summary":"optional",
 "explanation":"optional",
 "bugs":[],
 "vulnerabilities":[],
 "suggestions":[],
 "optimizedCode":"optional",
 "convertedCode":"optional"
}
`;
}

/* -------------------------
Safe JSON Extraction
------------------------- */

function extractJSON(text: string): any {

  try {

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return null;
    }

    const jsonString = cleaned.substring(start, end + 1);

    return JSON.parse(jsonString);

  } catch {
    return null;
  }
}

/* -------------------------
Main Service
------------------------- */

export async function analyzeCode(
  prompt: string,
  code: string
): Promise<CodeAnalysisResponse> {

  try {

    const intent = detectCodeIntent(prompt);

    /* limit code size to prevent token overflow */
    const safeCode = code.slice(0, 2000);

    const llmPrompt = generateCodePrompt(intent, prompt, safeCode);

    const llmResponse = await runLLM(llmPrompt);

    const parsed = extractJSON(llmResponse);

    if (!parsed) {

      /* fallback if JSON failed */
      return {
        success: true,
        type: "code",
        summary: llmResponse.slice(0, 300)
      };
    }

    return {
      success: true,
      ...parsed
    };

  } catch (error) {

    console.error("Code analysis error:", error);

    return {
      success: false,
      type: "code",
      summary: "Failed to analyze code."
    };
  }
}