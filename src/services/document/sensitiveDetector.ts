import { extractTextFromImage } from "../ai/ocrModel"
import { detectSensitiveContent } from "../wasm/privacyRules"

export async function detectSensitiveDocument(file: File) {

  const text = await extractTextFromImage(file)

  const detections = detectSensitiveContent(text)

  return detections
}