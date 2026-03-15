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
  intent: CodeIntent;
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

  if (
    p.includes("what does") ||
    p.includes("what is this code") ||
    p.includes("summary") ||
    p.includes("summarize") ||
    p.includes("describe")
  )
    return "summarize";

  if (p.includes("explain"))
    return "explain";

  if (
    p.includes("bug") ||
    p.includes("error") ||
    p.includes("issue") ||
    p.includes("vulnerability")
  )
    return "bug_detection";

  if (
    p.includes("optimize") ||
    p.includes("improve") ||
    p.includes("suggest")
  )
    return "optimization";

  if (
    p.includes("convert") ||
    p.includes("translate") ||
    p.includes("rewrite")
  )
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

  if (intent === "summarize") {
    return `
Explain briefly what this code does.

Code:
${code}

Return JSON:
{
"type":"code",
"summary":"short description"
}`;
  }

  if (intent === "explain") {
    return `
Explain this code step-by-step.

Code:
${code}

Return JSON:
{
"type":"code",
"explanation":"detailed explanation"
}`;
  }

  if (intent === "bug_detection") {
    return `
Find bugs and security issues in this code.

Code:
${code}

Return JSON:
{
"type":"code",
"bugs":[],
"vulnerabilities":[]
}`;
  }

  if (intent === "optimization") {
    return `
Suggest improvements for this code.

Code:
${code}

Return JSON:
{
"type":"code",
"suggestions":[],
"optimizedCode":"optional"
}`;
  }

  if (intent === "convert") {
    return `
Convert the code according to the request.

Request:
${userPrompt}

Code:
${code}

Return JSON:
{
"type":"code",
"convertedCode":"converted version"
}`;
  }

  return `
Analyze this code.

Code:
${code}

Return JSON:
{
"type":"code",
"summary":"what it does",
"suggestions":[]
}`;
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

  const intent = detectCodeIntent(prompt);
  try {


    /* limit code size to prevent token overflow */
    const MAX_CODE_LENGTH = 1500
    const safeCode = code.slice(0, MAX_CODE_LENGTH)
   
    const llmPrompt = generateCodePrompt(intent, prompt, safeCode);

    const llmResponse = await runLLM(llmPrompt);

    const parsed = extractJSON(llmResponse);

    if (!parsed) {

      /* fallback if JSON failed */
      return {
        success: true,
        intent,
        type: "code",
        summary: llmResponse.slice(0, 300)
      };
    }

    return {
      success: true,
      intent,
      ...parsed
    };

  } catch (error) {

    console.error("Code analysis error:", error);

    return {
      success: false,
      type: "code",
      intent,
      summary: "Failed to analyze code.",
    };
  }
}