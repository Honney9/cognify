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

Rules:
- No text outside JSON
- Use short sentences
- bugs, vulnerabilities, suggestions must be arrays
- If none exist return []

Format:
{
 "summary":"brief summary",
 "explanation":"step by step explanation",
 "bugs":["bug1","bug2"],
 "vulnerabilities":["security issue"],
 "suggestions":["improvement tip"],
 "optimizedCode":"optional",
 "convertedCode":"optional"
}
`;
}

/* -------------------------
Robust JSON Extraction
------------------------- */

function extractJSON(text: string): any {
  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) return null;

    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

/* -------------------------
Response Formatter
------------------------- */

function formatResponse(data: CodeAnalysisResponse): string {
  if (!data.success) return "❌ Failed to analyze code.";

  let md = "";

  if (data.summary) {
    md += `### 📋 Summary\n${data.summary}\n\n`;
  }

  if (data.explanation) {
    const explanationPoints = data.explanation
      .split(". ")
      .map((e) => `- ${e.trim()}`)
      .join("\n");

    md += `### 💡 Explanation\n${explanationPoints}\n\n`;
  }

  if (data.bugs && data.bugs.length > 0) {
    md += `### 🐛 Bugs\n${data.bugs.map((b) => `- ${b}`).join("\n")}\n\n`;
  }

  if (data.vulnerabilities && data.vulnerabilities.length > 0) {
    md += `### 🛡️ Vulnerabilities\n${data.vulnerabilities
      .map((v) => `- ${v}`)
      .join("\n")}\n\n`;
  }

  if (data.suggestions && data.suggestions.length > 0) {
    md += `### ✨ Suggestions\n${data.suggestions
      .map((s) => `- ${s}`)
      .join("\n")}\n\n`;
  }

  if (data.optimizedCode && data.optimizedCode !== "optional") {
    md += `### 🚀 Optimized Code\n\`\`\`javascript\n${data.optimizedCode}\n\`\`\`\n\n`;
  }

  if (data.convertedCode && data.convertedCode !== "optional") {
    md += `### 🔄 Converted Code\n\`\`\`javascript\n${data.convertedCode}\n\`\`\`\n\n`;
  }

  return md.trim();
}

/* -------------------------
Fallback Formatter
------------------------- */

function fallbackFormat(text: string): string {
  return text
    .replace(/"summary":/gi, "\n### 📋 Summary\n")
    .replace(/"explanation":/gi, "\n### 💡 Explanation\n")
    .replace(/"bugs":/gi, "\n### 🐛 Bugs\n")
    .replace(/"vulnerabilities":/gi, "\n### 🛡️ Vulnerabilities\n")
    .replace(/"suggestions":/gi, "\n### ✨ Suggestions\n")
    .replace(/[{}"]/g, "")
    .trim();
}

/* -------------------------
Main Service
------------------------- */

export async function analyzeCode(
  prompt: string,
  code: string
): Promise<string> {

  try {

    const intent = detectCodeIntent(prompt);

    // reduce code size slightly for faster LLM response
    const safeCode = code.slice(0, 1200);

    const llmPrompt = generateCodePrompt(intent, prompt, safeCode);

    const llmResponse = await runLLM(llmPrompt);

    const parsed = extractJSON(llmResponse);

    if (!parsed) {
      return fallbackFormat(llmResponse);
    }

    return formatResponse({
      success: true,
      ...parsed,
    });

  } catch (error) {

    console.error("Code analysis error:", error);
    return "Failed to analyze code. Please try again.";

  }
}