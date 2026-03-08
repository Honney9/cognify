/**
 * Document Detection Service
 * 
 * Detects document type from file content, extension, and structure
 */

import { DocumentType, DocumentDetectionResponse } from './types';

/**
 * Detect document type from file
 */
export async function detectDocumentType(
  file: File,
  content: string
): Promise<DocumentDetectionResponse> {
  try {
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop() || '';
    
    // Analyze content for document type indicators
    const detectionResult = analyzeDocumentContent(content, fileName);
    
    return {
      success: true,
      type: "document_detection",
      documentType: detectionResult.type,
      confidence: detectionResult.confidence,
      summary: detectionResult.summary
    };
  } catch (error) {
    return {
      success: true,
      type: "document_detection",
      documentType: DocumentType.UNKNOWN,
      confidence: 0.5,
      summary: "Unable to determine specific document type."
    };
  }
}

/**
 * Analyze document content to determine type
 */
function analyzeDocumentContent(content: string, fileName: string): {
  type: string;
  confidence: number;
  summary: string;
} {
  const contentLower = content.toLowerCase();
  const indicators: { [key: string]: string[] } = {
    [DocumentType.INVOICE]: ['invoice', 'bill to', 'invoice number', 'due date', 'amount due', 'subtotal', 'tax', 'total amount'],
    [DocumentType.RECEIPT]: ['receipt', 'purchase', 'payment received', 'transaction', 'thank you for your purchase'],
    [DocumentType.CONTRACT]: ['agreement', 'contract', 'parties agree', 'terms and conditions', 'signature', 'effective date', 'whereas'],
    [DocumentType.RENTAL_AGREEMENT]: ['lease', 'rental agreement', 'tenant', 'landlord', 'monthly rent', 'security deposit', 'lease term'],
    [DocumentType.RESUME]: ['resume', 'curriculum vitae', 'cv', 'education', 'work experience', 'skills', 'professional experience'],
    [DocumentType.REPORT]: ['report', 'executive summary', 'findings', 'recommendations', 'analysis', 'conclusion', 'methodology'],
    [DocumentType.LETTER]: ['dear', 'sincerely', 'regards', 'yours truly', 'to whom it may concern'],
    [DocumentType.FORM]: ['application', 'form', 'please fill', 'required fields', 'submit', 'applicant information'],
    [DocumentType.STATEMENT]: ['statement', 'account number', 'balance', 'transactions', 'period ending'],
    [DocumentType.CERTIFICATE]: ['certificate', 'hereby certify', 'awarded to', 'completion', 'achievement']
  };

  let bestMatch = DocumentType.UNKNOWN;
  let highestScore = 0;
  let matchedKeywords: string[] = [];

  // Score each document type based on keyword matches
  for (const [docType, keywords] of Object.entries(indicators)) {
    let score = 0;
    const foundKeywords: string[] = [];
    
    for (const keyword of keywords) {
      if (contentLower.includes(keyword)) {
        score++;
        foundKeywords.push(keyword);
      }
    }
    
    // Check filename for additional hints
    if (fileName.includes(docType.toLowerCase().replace(' ', '_'))) {
      score += 2;
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = docType as DocumentType;
      matchedKeywords = foundKeywords;
    }
  }

  // Calculate confidence based on score
  const totalKeywords = indicators[bestMatch]?.length || 1;
  const confidence = Math.min(0.95, Math.max(0.6, highestScore / totalKeywords));

  // Generate summary
  let summary = `The uploaded file appears to be ${getArticle(bestMatch)} ${bestMatch.toLowerCase()}`;
  
  if (matchedKeywords.length > 0) {
    summary += ` containing ${getDescriptivePhrase(bestMatch)}.`;
  } else {
    summary += ".";
  }

  return {
    type: bestMatch,
    confidence,
    summary
  };
}

/**
 * Get article (a/an) for a word
 */
function getArticle(word: string): string {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  return vowels.includes(word[0].toLowerCase()) ? 'an' : 'a';
}

/**
 * Get descriptive phrase for document type
 */
function getDescriptivePhrase(docType: string): string {
  const phrases: { [key: string]: string } = {
    [DocumentType.INVOICE]: 'billing and payment information',
    [DocumentType.RECEIPT]: 'transaction details',
    [DocumentType.CONTRACT]: 'legal terms and conditions',
    [DocumentType.RENTAL_AGREEMENT]: 'rental terms and obligations',
    [DocumentType.RESUME]: 'professional qualifications and experience',
    [DocumentType.REPORT]: 'findings and analysis',
    [DocumentType.LETTER]: 'correspondence content',
    [DocumentType.FORM]: 'form fields and instructions',
    [DocumentType.STATEMENT]: 'account information',
    [DocumentType.CERTIFICATE]: 'certification details'
  };
  
  return phrases[docType] || 'relevant information';
}
