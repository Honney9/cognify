import { detectSensitiveContent } from "../services/wasm/privacyRules"
import Tesseract from "tesseract.js"

self.onmessage = async (event) => {

  try {

    const { image } = event.data

    const canvas = new OffscreenCanvas(image.width, image.height)
    const ctx = canvas.getContext("2d")

    ctx?.drawImage(image, 0, 0)

    const blob = await canvas.convertToBlob()

    console.log("[Vision Worker] Running OCR...")

    // OCR
    const ocr = await Tesseract.recognize(blob, "eng")

    const text = ocr.data.text || ""

    console.log("[Vision Worker] OCR Text:", text.slice(0,150))

    // Sensitive detection
    const detections = detectSensitiveContent(text)

    const sensitive = detections.length > 0

    console.log("[Vision Worker] Sensitive:", sensitive)

    self.postMessage({
      success: true,
      text,
      detections,
      sensitive
    })

  } catch (err) {

    console.error("[Vision Worker Error]", err)

    self.postMessage({
      success: false,
      error: "OCR processing failed"
    })

  }

}