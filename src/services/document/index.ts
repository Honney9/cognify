/**
 * Document Service Module
 * 
 * Main exports for document processing functionality
 */

export { processDocument, isDocumentProcessingRequest } from './processor';
export { detectDocumentType } from './detector';
export { validateDocument } from './validator';
export { analyzeDocument } from './analyzer';

export type {
  DocumentDetectionResponse,
  DocumentValidationResponse,
  DocumentAnalysisResponse,
  DocumentProcessingResult,
  DocumentMetadata,
  ValidationIssue
} from './types';

export { DocumentType } from './types';
