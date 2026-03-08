/**
 * Document Analysis Service
 * 
 * Analyzes document content and extracts key information using LLM
 */

import { DocumentAnalysisResponse } from './types';
import { runLLM } from '../ai/llmModel';

/**
 * Analyze document content and extract key insights
 */
export async function analyzeDocument(
  file: File,
  content: string,
  documentType: string
): Promise<DocumentAnalysisResponse> {
  try {
    // Prepare analysis prompt based on document type
    const prompt = buildAnalysisPrompt(content, documentType);
    
    // Use LLM for analysis
    const llmResponse = await runLLM(prompt);
    
    // Parse LLM response
    const analysis = parseLLMResponse(llmResponse, documentType);
    
    return {
      success: true,
      type: "document_analysis",
      summary: analysis.summary,
      keyPoints: analysis.keyPoints
    };
  } catch (error) {
    // Fallback to rule-based analysis if LLM fails
    const fallbackAnalysis = performRuleBasedAnalysis(content, documentType);
    
    return {
      success: true,
      type: "document_analysis",
      summary: fallbackAnalysis.summary,
      keyPoints: fallbackAnalysis.keyPoints
    };
  }
}

/**
 * Build analysis prompt for LLM
 */
function buildAnalysisPrompt(content: string, documentType: string): string {
  const truncatedContent = content.length > 3000 
    ? content.substring(0, 3000) + "... [truncated]"
    : content;
  
  const prompts: { [key: string]: string } = {
    "Invoice": `Analyze this invoice and provide:
1. A brief summary of what this invoice is for
2. Key details: invoice number, amounts, due date, vendor/client names
3. Notable items or services listed
4. Payment terms or conditions

Invoice content:
${truncatedContent}

Respond in JSON format:
{
  "summary": "brief description",
  "keyPoints": ["point 1", "point 2", "point 3"]
}`,
    
    "Receipt": `Analyze this receipt and provide:
1. A brief summary of the transaction
2. Key details: merchant name, transaction date, total amount
3. Notable items purchased
4. Payment method if mentioned

Receipt content:
${truncatedContent}

Respond in JSON format:
{
  "summary": "brief description",
  "keyPoints": ["point 1", "point 2", "point 3"]
}`,
    
    "Contract": `Analyze this contract and provide:
1. A brief summary of the contract's purpose
2. Key parties involved
3. Main obligations and terms
4. Important dates or durations
5. Notable clauses or conditions

Contract content:
${truncatedContent}

Respond in JSON format:
{
  "summary": "brief description",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4"]
}`,
    
    "Rental Agreement": `Analyze this rental agreement and provide:
1. A brief summary of the agreement
2. Parties involved (landlord and tenant)
3. Property details
4. Lease duration and rent amount
5. Security deposit and other fees
6. Key terms and conditions

Rental agreement content:
${truncatedContent}

Respond in JSON format:
{
  "summary": "brief description",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4"]
}`,
    
    "Resume": `Analyze this resume and provide:
1. A brief summary of the candidate's profile
2. Current or most recent position
3. Years of experience
4. Key skills and qualifications
5. Notable achievements or education

Resume content:
${truncatedContent}

Respond in JSON format:
{
  "summary": "brief description",
  "keyPoints": ["point 1", "point 2", "point 3"]
}`,
    
    "default": `Analyze this ${documentType} document and provide:
1. A brief summary of the document's purpose and content
2. Key information or findings
3. Important dates, names, or numbers
4. Notable sections or highlights

Document content:
${truncatedContent}

Respond in JSON format:
{
  "summary": "brief description",
  "keyPoints": ["point 1", "point 2", "point 3"]
}`
  };
  
  return prompts[documentType] || prompts["default"];
}

/**
 * Parse LLM response
 */
function parseLLMResponse(response: string, documentType: string): { summary: string; keyPoints: string[] } {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.summary && Array.isArray(parsed.keyPoints)) {
        return {
          summary: parsed.summary,
          keyPoints: parsed.keyPoints.filter((point: any) => typeof point === 'string')
        };
      }
    }
    
    // If JSON parsing fails, extract information from text
    return extractFromText(response, documentType);
  } catch (error) {
    return extractFromText(response, documentType);
  }
}

/**
 * Extract analysis from plain text response
 */
function extractFromText(text: string, documentType: string): { summary: string; keyPoints: string[] } {
  const lines = text.split('\n').filter(line => line.trim());
  
  // First non-empty line as summary
  const summary = lines.length > 0 
    ? lines[0].replace(/^(summary|Summary):\s*/i, '').trim()
    : `This document appears to be ${getArticle(documentType)} ${documentType.toLowerCase()}.`;
  
  // Extract bullet points or numbered items
  const keyPoints: string[] = [];
  for (const line of lines) {
    const cleaned = line.trim();
    // Match bullet points, numbered lists, or dash lists
    const match = cleaned.match(/^(?:[-•*]\s*|\d+\.\s*)(.+)$/);
    if (match && match[1]) {
      keyPoints.push(match[1].trim());
    }
  }
  
  // If no key points found, take first few sentences
  if (keyPoints.length === 0) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    keyPoints.push(...sentences.slice(1, 4).map(s => s.trim()));
  }
  
  // Limit to 5 key points
  return {
    summary: summary || `Analysis of ${documentType} document.`,
    keyPoints: keyPoints.slice(0, 5).filter(p => p.length > 0)
  };
}

/**
 * Perform rule-based analysis as fallback
 */
function performRuleBasedAnalysis(content: string, documentType: string): { summary: string; keyPoints: string[] } {
  const keyPoints: string[] = [];
  const contentLower = content.toLowerCase();
  
  // Extract key information based on document type
  switch (documentType) {
    case "Invoice":
      keyPoints.push(...extractInvoiceInfo(content));
      break;
    case "Receipt":
      keyPoints.push(...extractReceiptInfo(content));
      break;
    case "Contract":
    case "Rental Agreement":
      keyPoints.push(...extractContractInfo(content));
      break;
    case "Resume":
      keyPoints.push(...extractResumeInfo(content));
      break;
    default:
      keyPoints.push(...extractGeneralInfo(content));
  }
  
  const summary = `This document is ${getArticle(documentType)} ${documentType.toLowerCase()} ${getDocumentDescription(documentType)}.`;
  
  return {
    summary,
    keyPoints: keyPoints.slice(0, 5)
  };
}

// Helper extraction functions

function extractInvoiceInfo(content: string): string[] {
  const info: string[] = [];
  
  // Extract invoice number
  const invoiceMatch = content.match(/invoice\s*#?\s*:?\s*(\S+)/i);
  if (invoiceMatch) {
    info.push(`Invoice Number: ${invoiceMatch[1]}`);
  }
  
  // Extract amounts
  const amounts = content.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g);
  if (amounts && amounts.length > 0) {
    const total = amounts[amounts.length - 1];
    info.push(`Total Amount: ${total}`);
  }
  
  // Extract dates
  const dateMatch = content.match(/(?:date|due|issued):\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (dateMatch) {
    info.push(`Date: ${dateMatch[1]}`);
  }
  
  return info;
}

function extractReceiptInfo(content: string): string[] {
  const info: string[] = [];
  
  // Extract merchant name (usually at the top)
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    info.push(`Merchant: ${lines[0].trim()}`);
  }
  
  // Extract amounts
  const amounts = content.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g);
  if (amounts && amounts.length > 0) {
    info.push(`Total: ${amounts[amounts.length - 1]}`);
  }
  
  // Extract date
  const dateMatch = content.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
  if (dateMatch) {
    info.push(`Date: ${dateMatch[0]}`);
  }
  
  return info;
}

function extractContractInfo(content: string): string[] {
  const info: string[] = [];
  
  // Extract duration
  const durationMatch = content.match(/(\d+)\s*(month|year|week)s?/i);
  if (durationMatch) {
    info.push(`Duration: ${durationMatch[1]} ${durationMatch[2]}s`);
  }
  
  // Extract amounts
  const amountMatch = content.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (amountMatch) {
    info.push(`Amount: $${amountMatch[1]}`);
  }
  
  // Look for party names (simplified)
  const partyMatch = content.match(/between\s+([^,\n]+)\s+and\s+([^,\n]+)/i);
  if (partyMatch) {
    info.push(`Parties: ${partyMatch[1].trim()} and ${partyMatch[2].trim()}`);
  }
  
  return info;
}

function extractResumeInfo(content: string): string[] {
  const info: string[] = [];
  
  // Extract name (usually first line)
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    info.push(`Candidate: ${lines[0].trim()}`);
  }
  
  // Extract email
  const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    info.push(`Contact: ${emailMatch[0]}`);
  }
  
  // Extract years of experience
  const expMatch = content.match(/(\d+)\+?\s*years?\s*(?:of)?\s*experience/i);
  if (expMatch) {
    info.push(`Experience: ${expMatch[1]}+ years`);
  }
  
  return info;
}

function extractGeneralInfo(content: string): string[] {
  const info: string[] = [];
  
  // Extract dates
  const dates = content.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g);
  if (dates && dates.length > 0) {
    info.push(`Contains dates: ${dates.slice(0, 2).join(', ')}`);
  }
  
  // Extract amounts
  const amounts = content.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g);
  if (amounts && amounts.length > 0) {
    info.push(`Contains amounts: ${amounts.slice(0, 2).join(', ')}`);
  }
  
  // Word count
  const wordCount = content.split(/\s+/).length;
  info.push(`Document length: ~${wordCount} words`);
  
  return info;
}

function getArticle(word: string): string {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  return vowels.includes(word[0].toLowerCase()) ? 'an' : 'a';
}

function getDocumentDescription(documentType: string): string {
  const descriptions: { [key: string]: string } = {
    "Invoice": "containing billing and payment information",
    "Receipt": "showing transaction details",
    "Contract": "outlining legal agreements",
    "Rental Agreement": "detailing rental terms and conditions",
    "Resume": "presenting professional qualifications",
    "Report": "containing analysis and findings",
    "Letter": "containing written correspondence",
    "Form": "with fields for information collection",
    "Statement": "showing account information",
    "Certificate": "certifying an achievement or completion"
  };
  
  return descriptions[documentType] || "containing relevant information";
}
