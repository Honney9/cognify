/**
 * Document Processor
 */

import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?worker";

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker()

import { detectDocumentType } from "./detector";
import { validateDocument } from "./validator";
import { analyzeDocument } from "./analyzer";

import type { DocumentProcessingResult } from "./types";

import { detectSensitiveContent } from "../wasm/privacyRules";
import { extractTextFromImage } from "../ai/ocrModel";

/**
 * PDF.js Worker Configuration
 */


pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker()

/**
 * Main Document Processing Function
 */
export async function processDocument(
  file: File,
  prompt: string
): Promise<DocumentProcessingResult> {

  try {

    const content = await extractTextContent(file);

    if (!content || content.trim().length === 0) {
      throw new Error("Could not extract text content from document");
    }

    /**
     * 🔐 Sensitive Content Detection
     */
    const sensitiveDetections = detectSensitiveContent(content);
    const isSensitive = sensitiveDetections.length > 0;

    const promptLower = prompt.toLowerCase();

    const result: DocumentProcessingResult = {
      sensitive: isSensitive,
      sensitiveDetections,
      detection: undefined,
      validation: undefined,
      analysis: undefined
    };

    /**
     * Determine requested operations
     */
    const needsDetection =
      promptLower.includes("detect") ||
      promptLower.includes("identify") ||
      promptLower.includes("type");

    const needsValidation =
      promptLower.includes("valid") ||
      promptLower.includes("check") ||
      promptLower.includes("verify");

    const needsAnalysis =
      promptLower.includes("analyz") ||
      promptLower.includes("extract") ||
      promptLower.includes("summary");

    const performAll = !needsDetection && !needsValidation && !needsAnalysis;

    /**
     * Document Type Detection
     */
    const detection = await detectDocumentType(file, content);
    const documentType = detection.documentType;

    if (needsDetection || performAll) {
      result.detection = detection;
    }

    /**
     * Document Validation
     */
    if (needsValidation || performAll) {
      result.validation = await validateDocument(file, content, documentType);
    }

    /**
     * Document Analysis
     */
    if (needsAnalysis || performAll) {
      result.analysis = await analyzeDocument(file, content, documentType);
    }

    return result;

  } catch (error) {

    console.error("Document processing error:", error);
    throw error;

  }
}

/**
 * Extract text from supported file formats
 */
async function extractTextContent(file: File): Promise<string> {

  const fileName = file.name.toLowerCase();

  /**
   * 1️⃣ Image Files
   */
  if (/\.(png|jpe?g|gif|bmp|webp)$/i.test(fileName)) {
    return await extractTextFromImage(file)
  }

  /**
   * 2️⃣ TXT
   */
  if (fileName.endsWith(".txt")) {
    return await file.text();
  }

  /**
   * 3️⃣ DOCX
   */
  if (fileName.endsWith(".docx")) {

    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.extractRawText({
      arrayBuffer
    });

    return result.value;
  }

  /**
   * 4️⃣ PDF Processing
   */
  if (fileName.endsWith(".pdf")) {

    try {

      const arrayBuffer = await file.arrayBuffer();

      /**
       * Detect images disguised as PDFs
       */
      const header = new Uint8Array(arrayBuffer.slice(0, 4));

      // JPEG signature
      if (header[0] === 0xff && header[1] === 0xd8) {
        throw new Error("IMAGE_DISGUISED_AS_PDF");
      }

      // PNG signature
      if (header[0] === 0x89 && header[1] === 0x50) {
        throw new Error("IMAGE_DISGUISED_AS_PDF");
      }

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        stopAtErrors: false,
        isEvalSupported: false
      });

      const pdf = await loadingTask.promise;

      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {

        const page = await pdf.getPage(i);

        const textContent = await page.getTextContent();

        fullText +=
          textContent.items
            .map((item: any) => item.str)
            .join(" ") + "\n";
      }

      if (!fullText.trim()) {
        console.log("Scanned PDF detected → using OCR")
        throw new Error("SCANNED_PDF");
      }

      return fullText;

    } catch (error: any) {

      if (error.message === "IMAGE_DISGUISED_AS_PDF") {
        throw new Error(
          "This file is actually an image renamed to .pdf. Upload the original image or a real PDF."
        );
      }

      if (error.message === "SCANNED_PDF") {
        throw new Error(
          "This PDF is a scanned image with no selectable text. Use Photo mode instead."
        );
      }

      throw error;
    }
  }

  /**
   * Fallback
   */
  try {
    return await file.text();
  } catch {
    throw new Error("Unsupported file format.");
  }
}

/**
 * Detect if prompt relates to document processing
 */
export function isDocumentProcessingRequest(prompt: string): boolean {

  const promptLower = prompt.toLowerCase();

  return [
    "document",
    "invoice",
    "receipt",
    "pdf",
    "docx",
    "analyze",
    "extract"
  ].some(k => promptLower.includes(k));

}