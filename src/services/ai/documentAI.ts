import { TextGeneration } from "runanywhere/web";

export async function analyzeDocument(file: File) {
  const text = await file.text();

  const result = await TextGeneration.generate(
    `Analyze this document for structure, consistency, and risks:\n\n${text}`
  );

  return {
    summary: result.text,
    anomalies: [],
  };
}