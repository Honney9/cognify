import { VLM } from "runanywhere/web";

export async function analyzeVision(
  file: File,
  options: { mode: "photo" | "screenshot" }
) {
  const image = await createImageBitmap(file);

  const prompt =
    options.mode === "screenshot"
      ? "Analyze this UI screenshot. Detect sensitive information, risks, and context."
      : "Describe the scene, intent, and any privacy-sensitive content.";

  const result = await VLM.process({
    image,
    prompt,
  });

  return {
    scene: result.text,
    tags: [],
  };
}