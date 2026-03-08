/**
 * Document Processor
 */
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { detectDocumentType } from './detector';
import { validateDocument } from './validator';
import { analyzeDocument } from './analyzer';
import type { DocumentProcessingResult } from './types';

/**
 * PDF.js Worker Configuration
 * For Vite/WebWorker environments, we use the local worker build.
 */
// FIX: Use the standard URL constructor which Vite and TS understand better
const pdfWorkerUrl = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function processDocument(
  file: File,
  prompt: string
): Promise<DocumentProcessingResult> {
  try {
    const content = await extractTextContent(file);
    
    if (!content || content.trim().length === 0) {
      throw new Error("Could not extract text content from document");
    }
    
    const promptLower = prompt.toLowerCase();
    const result: DocumentProcessingResult = {};
    
    // Determine operations
    const needsDetection = promptLower.includes('detect') || promptLower.includes('identify') || promptLower.includes('what type');
    const needsValidation = promptLower.includes('valid') || promptLower.includes('check') || promptLower.includes('verify');
    const needsAnalysis = promptLower.includes('analyz') || promptLower.includes('extract') || promptLower.includes('summary');
    const performAll = !needsDetection && !needsValidation && !needsAnalysis;
    
    let documentType = "Unknown Document";
    const detection = await detectDocumentType(file, content);
    documentType = detection.documentType;

    if (needsDetection || performAll) result.detection = detection;
    if (needsValidation || performAll) result.validation = await validateDocument(file, content, documentType);
    if (needsAnalysis || performAll) result.analysis = await analyzeDocument(file, content, documentType);
    
    return result;
  } catch (error) {
    console.error("Document processing error:", error);
    throw error;
  }
}

async function extractTextContent(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  
  // 1. Image Check
  if (/\.(png|jpe?g|gif|bmp|webp|svg)$/.test(fileName)) {
    throw new Error("IMAGE_FILE");
  }
  
  // 2. TXT / DOCX
  if (fileName.endsWith('.txt')) return await file.text();
  if (fileName.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  // 3. PDF - FIXED AND STRENGTHENED
  // 3. PDF Section in processor.ts
  if (fileName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Check for Image Signatures (Magic Numbers)
      const header = new Uint8Array(arrayBuffer.slice(0, 4));
      // JPEG check: FF D8 FF
      if (header[0] === 0xFF && header[1] === 0xD8) {
        throw new Error("IMAGE_DISGUISED_AS_PDF");
      }
      // PNG check: 89 50 4E 47
      if (header[0] === 0x89 && header[1] === 0x50) {
        throw new Error("IMAGE_DISGUISED_AS_PDF");
      }

      // If it passes, continue with normal PDF parsing
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
        fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
      }

      if (!fullText.trim()) throw new Error("SCANNED_PDF");
      return fullText;

    } catch (error: any) {
      if (error.message === "IMAGE_DISGUISED_AS_PDF") {
        throw new Error("This file is actually an image renamed to .pdf. Please upload the original image or a real PDF.");
      }
      if (error.message === "SCANNED_PDF") {
        throw new Error("This PDF is a scanned image and contains no selectable text. Please use the 'Photo' mode for analysis.");
      }
      throw error;
    }
  }

  // Fallback
  try {
    return await file.text();
  } catch {
    throw new Error("Unsupported file format.");
  }
}

export function isDocumentProcessingRequest(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  return ['document', 'invoice', 'receipt', 'pdf', 'docx', 'analyze', 'extract'].some(k => promptLower.includes(k));
}