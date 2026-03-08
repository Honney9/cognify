/**
 * Document Validation Service
 * 
 * Validates document structure, format, and content for anomalies
 */

import { DocumentValidationResponse, ValidationIssue } from './types';

/**
 * Validate document structure and content
 */
export async function validateDocument(
  file: File,
  content: string,
  documentType: string
): Promise<DocumentValidationResponse> {
  try {
    const issues: string[] = [];
    
    // Perform various validation checks
    const structuralIssues = checkStructuralIntegrity(content, documentType);
    const contentIssues = checkContentValidity(content, documentType);
    const anomalies = detectAnomalies(content, file);
    
    issues.push(...structuralIssues, ...contentIssues, ...anomalies);
    
    const valid = issues.length === 0;
    const confidence = calculateValidationConfidence(issues, content);
    
    return {
      success: true,
      type: "document_validation",
      valid,
      issues,
      confidence
    };
  } catch (error) {
    return {
      success: true,
      type: "document_validation",
      valid: false,
      issues: ["Validation failed due to processing error"],
      confidence: 0.5
    };
  }
}

/**
 * Check structural integrity of document
 */
function checkStructuralIntegrity(content: string, documentType: string): string[] {
  const issues: string[] = [];
  
  // Check for minimum content length
  if (content.trim().length < 50) {
    issues.push("Document appears to be too short or empty");
  }
  
  // Check for suspicious patterns
  if (hasRepeatingPatterns(content)) {
    issues.push("Suspicious repeating patterns detected");
  }
  
  // Document type specific checks
  switch (documentType) {
    case "Invoice":
      if (!hasInvoiceStructure(content)) {
        issues.push("Missing required invoice elements (e.g., invoice number, amounts, dates)");
      }
      break;
    case "Contract":
    case "Rental Agreement":
      if (!hasContractStructure(content)) {
        issues.push("Missing typical contract elements (e.g., signature fields, terms section)");
      }
      break;
    case "Receipt":
      if (!hasReceiptStructure(content)) {
        issues.push("Missing typical receipt elements (e.g., transaction details, amounts)");
      }
      break;
  }
  
  return issues;
}

/**
 * Check content validity
 */
function checkContentValidity(content: string, documentType: string): string[] {
  const issues: string[] = [];
  
  // Check for proper date formats
  const dates = extractDates(content);
  for (const date of dates) {
    if (!isValidDate(date)) {
      issues.push(`Invalid or suspicious date format detected: ${date}`);
    }
  }
  
  // Check for numeric consistency
  const numbers = extractNumbers(content);
  if (numbers.length > 0 && hasInconsistentNumbers(numbers, content)) {
    issues.push("Numerical inconsistencies detected in amounts or calculations");
  }
  
  // Check for missing critical information
  if (documentType === "Invoice" && !hasPaymentInfo(content)) {
    issues.push("Missing payment information");
  }
  
  return issues;
}

/**
 * Detect anomalies and potential fraud indicators
 */
function detectAnomalies(content: string, file: File): string[] {
  const anomalies: string[] = [];
  
  // Check for copy-paste indicators
  if (hasMultipleFontIndicators(content)) {
    anomalies.push("Multiple formatting styles detected (possible tampering)");
  }
  
  // Check for suspicious modifications
  if (hasWhiteOutPatterns(content)) {
    anomalies.push("Potential content modification detected");
  }
  
  // Check file metadata
  if (file.lastModified) {
    const fileDate = new Date(file.lastModified);
    const now = new Date();
    const daysSinceModification = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceModification < 1) {
      const contentDates = extractDates(content);
      const hasOldDates = contentDates.some(date => {
        const parsedDate = new Date(date);
        const yearDiff = now.getFullYear() - parsedDate.getFullYear();
        return yearDiff > 1;
      });
      
      if (hasOldDates) {
        anomalies.push("File recently modified but contains old dates (possible forgery)");
      }
    }
  }
  
  return anomalies;
}

/**
 * Calculate validation confidence score
 */
function calculateValidationConfidence(issues: string[], content: string): number {
  if (issues.length === 0) {
    return 0.95;
  }
  
  const severityWeights = issues.map(issue => {
    if (issue.includes("forgery") || issue.includes("tampering")) return 0.3;
    if (issue.includes("missing") || issue.includes("invalid")) return 0.15;
    return 0.1;
  });
  
  const totalPenalty = severityWeights.reduce((sum, weight) => sum + weight, 0);
  const confidence = Math.max(0.4, 0.95 - totalPenalty);
  
  return Math.round(confidence * 100) / 100;
}

// Helper functions

function hasRepeatingPatterns(content: string): boolean {
  const words = content.split(/\s+/);
  const wordCounts: { [key: string]: number } = {};
  
  for (const word of words) {
    if (word.length > 5) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }
  
  const highFrequencyWords = Object.values(wordCounts).filter(count => count > 10);
  return highFrequencyWords.length > 3;
}

function hasInvoiceStructure(content: string): boolean {
  const contentLower = content.toLowerCase();
  const requiredElements = ['invoice', 'total', 'amount'];
  const foundElements = requiredElements.filter(elem => contentLower.includes(elem));
  return foundElements.length >= 2;
}

function hasContractStructure(content: string): boolean {
  const contentLower = content.toLowerCase();
  const requiredElements = ['agreement', 'party', 'parties', 'terms'];
  const foundElements = requiredElements.filter(elem => contentLower.includes(elem));
  return foundElements.length >= 2;
}

function hasReceiptStructure(content: string): boolean {
  const contentLower = content.toLowerCase();
  const requiredElements = ['receipt', 'total', 'paid', 'payment', 'transaction'];
  const foundElements = requiredElements.filter(elem => contentLower.includes(elem));
  return foundElements.length >= 2;
}

function extractDates(content: string): string[] {
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g,  // MM/DD/YYYY
    /\d{1,2}-\d{1,2}-\d{2,4}/g,     // MM-DD-YYYY
    /\d{4}-\d{2}-\d{2}/g,           // YYYY-MM-DD
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/gi  // Month DD, YYYY
  ];
  
  const dates: string[] = [];
  for (const pattern of datePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  }
  
  return dates;
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  
  const year = date.getFullYear();
  return year >= 1900 && year <= new Date().getFullYear() + 10;
}

function extractNumbers(content: string): number[] {
  const numberPattern = /\$?\d+(?:,\d{3})*(?:\.\d{2})?/g;
  const matches = content.match(numberPattern);
  
  if (!matches) return [];
  
  return matches.map(match => {
    const cleaned = match.replace(/[$,]/g, '');
    return parseFloat(cleaned);
  }).filter(num => !isNaN(num));
}

function hasInconsistentNumbers(numbers: number[], content: string): boolean {
  // Simple check: look for calculation errors in invoices
  if (numbers.length < 3) return false;
  
  const contentLower = content.toLowerCase();
  if (contentLower.includes('subtotal') && contentLower.includes('total')) {
    // Basic heuristic: check if largest number is roughly sum of others
    const sorted = [...numbers].sort((a, b) => b - a);
    const largest = sorted[0];
    const sum = sorted.slice(1, 4).reduce((a, b) => a + b, 0);
    
    // Allow 20% margin for tax/fees
    const difference = Math.abs(largest - sum);
    return difference > sum * 0.5;
  }
  
  return false;
}

function hasPaymentInfo(content: string): boolean {
  const contentLower = content.toLowerCase();
  const paymentIndicators = ['payment', 'due', 'bank', 'account', 'payable', 'pay to'];
  return paymentIndicators.some(indicator => contentLower.includes(indicator));
}

function hasMultipleFontIndicators(content: string): boolean {
  // In plain text, we can't detect fonts, but we can detect unusual spacing patterns
  const lines = content.split('\n');
  const spacingVariance = lines.map(line => line.match(/\s+/g)?.length || 0);
  const avgSpacing = spacingVariance.reduce((a, b) => a + b, 0) / spacingVariance.length;
  
  const outliers = spacingVariance.filter(spacing => Math.abs(spacing - avgSpacing) > avgSpacing * 0.5);
  return outliers.length > lines.length * 0.3;
}

function hasWhiteOutPatterns(content: string): boolean {
  // Detect suspicious whitespace patterns
  const suspiciousPatterns = [
    /\s{10,}/g,  // Long whitespace sequences
    /\n{5,}/g    // Excessive line breaks
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(content));
}
