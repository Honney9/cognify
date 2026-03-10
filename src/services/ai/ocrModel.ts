import Tesseract from "tesseract.js"

/**
 * OCR text extraction for image files
 */
export async function extractTextFromImage(image: File): Promise<string> {

  try {

    const { data } = await Tesseract.recognize(
      image,
      "eng",
      {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`)
          }
        }
      }
    )

    const text = data.text?.trim()

    if (!text) {
      console.warn("OCR completed but no text detected")
      return ""
    }

    return text

  } catch (error) {

    console.error("OCR processing failed:", error)

    throw new Error("Failed to extract text from image")

  }
}