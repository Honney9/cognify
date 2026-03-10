/**
 * Document Processing Types
 * 
 * Type definitions for document detection, validation, and analysis features
 */
import type { PrivacyDetection } from "../wasm/privacyRules";
/**
 * Document Detection Response
 */
export interface DocumentDetectionResponse {
  success: true;
  type: "document_detection";
  documentType: string;
  confidence: number;
  summary: string;
}

/**
 * Document Validation Response
 */
export interface DocumentValidationResponse {
  success: true;
  type: "document_validation";
  valid: boolean;
  issues: string[];
  confidence: number;
}

/**
 * Document Analysis Response
 */
export interface DocumentAnalysisResponse {
  success: true;
  type: "document_analysis";
  summary: string;
  keyPoints: string[];
}

/**
 * Combined Document Processing Result
 */
export interface DocumentProcessingResult {
  detection?: DocumentDetectionResponse;
  validation?: DocumentValidationResponse;
  analysis?: DocumentAnalysisResponse;

  // 🔐 Secure Vault Privacy Detection
  sensitive?: boolean;
  sensitiveDetections?: PrivacyDetection[];
}

/**
 * Document Types Enum
 */
export enum DocumentType {
  INVOICE = "Invoice",
  RECEIPT = "Receipt",
  CONTRACT = "Contract",
  RENTAL_AGREEMENT = "Rental Agreement",
  RESUME = "Resume",
  REPORT = "Report",
  LETTER = "Letter",
  FORM = "Form",
  STATEMENT = "Statement",
  CERTIFICATE = "Certificate",
  UNKNOWN = "Unknown Document"
}

/**
 * Validation Issue Types
 */
export interface ValidationIssue {
  type: "missing_field" | "format_error" | "suspicious_content" | "structural_error";
  description: string;
  severity: "error" | "warning";
}

/**
 * Document Content Metadata
 */
export interface DocumentMetadata {
  pageCount?: number;
  wordCount?: number;
  hasImages?: boolean;
  hasSignatures?: boolean;
  extractedText?: string;
}
