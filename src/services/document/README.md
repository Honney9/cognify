# Document Processing Feature

This document describes the new document detection, validation, and analysis feature.

## Overview

The system now supports three types of document processing operations:

1. **Document Detection** - Identifies the type of document (invoice, contract, receipt, etc.)
2. **Document Validation** - Checks for structural issues, anomalies, and fraud indicators
3. **Document Analysis** - Extracts key information and provides a summary

## Usage

### Triggering Document Processing

When a user uploads a document file and types prompts containing specific keywords, the system automatically processes the document:

**Detection Keywords:**
- detect, identify, what type, what is this, what kind

**Validation Keywords:**
- valid, check, verify, anomaly, fraud, compliance, consistent

**Analysis Keywords:**
- analyze, extract, summarize, summary, key points, what does

**Examples:**
- "Detect what type of document this is"
- "Validate this invoice for fraud"
- "Analyze this contract and extract key points"
- "Check this document for anomalies"

If no specific keywords are provided, the system performs all three operations.

## Response Formats

### 1. Document Detection Response

```json
{
  "success": true,
  "type": "document_detection",
  "documentType": "Invoice",
  "confidence": 0.92,
  "summary": "The uploaded file appears to be an invoice containing billing information."
}
```

**UI Display:**
```
📄 Document Detected

Type: Invoice
Confidence: 92%

This document appears to be an invoice containing billing information.
```

### 2. Document Validation Response

**Valid Document:**
```json
{
  "success": true,
  "type": "document_validation",
  "valid": true,
  "issues": [],
  "confidence": 0.88
}
```

**UI Display:**
```
✅ Document Validation

Status: Valid Document
Confidence: 88%

No structural issues were detected in the document.
```

**Invalid Document:**
```json
{
  "success": true,
  "type": "document_validation",
  "valid": false,
  "issues": [
    "Missing required invoice elements (e.g., invoice number, amounts, dates)",
    "File recently modified but contains old dates (possible forgery)"
  ],
  "confidence": 0.65
}
```

**UI Display:**
```
⚠️ Document Validation

Status: Invalid or Suspicious

Issues Found:
• Missing required invoice elements (e.g., invoice number, amounts, dates)
• File recently modified but contains old dates (possible forgery)
```

### 3. Document Analysis Response

```json
{
  "success": true,
  "type": "document_analysis",
  "summary": "This document is a rental agreement between two parties.",
  "keyPoints": [
    "Lease duration: 12 months",
    "Monthly rent: $1200",
    "Security deposit required"
  ]
}
```

**UI Display:**
```
📊 Document Analysis

Summary:
This document is a rental agreement between two parties.

Key Points:
• Lease duration: 12 months
• Monthly rent: $1200
• Security deposit required
```

### 4. Combined Response (All Operations)

When no specific operation is requested, the system returns all three:

```json
{
  "detection": {
    "success": true,
    "type": "document_detection",
    "documentType": "Invoice",
    "confidence": 0.92,
    "summary": "The uploaded file appears to be an invoice..."
  },
  "validation": {
    "success": true,
    "type": "document_validation",
    "valid": true,
    "issues": [],
    "confidence": 0.88
  },
  "analysis": {
    "success": true,
    "type": "document_analysis",
    "summary": "This invoice is for consulting services...",
    "keyPoints": [
      "Invoice Number: INV-2024-001",
      "Total Amount: $2,500",
      "Due Date: 2024-03-15"
    ]
  }
}
```

The UI displays all three sections in sequence.

## Supported Document Types

The system can detect the following document types:

- Invoice
- Receipt
- Contract
- Rental Agreement
- Resume
- Report
- Letter
- Form
- Statement
- Certificate
- Unknown Document (fallback)

## Validation Checks

The validation system performs the following checks:

1. **Structural Integrity:**
   - Minimum content length
   - Required elements for document type
   - Suspicious repeating patterns

2. **Content Validity:**
   - Date format validation
   - Date range checks (1900 - current year + 10)
   - Numerical consistency
   - Missing critical information

3. **Anomaly Detection:**
   - Multiple formatting styles (tampering indicator)
   - Content modification patterns
   - File modification date vs. document dates
   - Excessive whitespace (white-out patterns)

## File Format Support

**Currently Supported:**
- Plain text files (.txt)
- Any file readable as text

**Coming Soon:**
- PDF documents (.pdf)
- Word documents (.doc, .docx)
- Rich text files (.rtf)

## Architecture

### Service Module Structure

```
services/document/
├── types.ts           # TypeScript interfaces
├── detector.ts        # Document type detection
├── validator.ts       # Document validation
├── analyzer.ts        # Document analysis (with LLM)
├── processor.ts       # Main entry point
└── index.ts          # Exports
```

### Integration Points

1. **Orchestrator** (`services/orchestrator.ts`)
   - Detects document processing requests
   - Calls document processor
   - Returns formatted results

2. **Worker** (`workers/ai.worker.ts`)
   - Handles document processing in background thread
   - Sends results to UI

3. **ChatView** (`components/ChatView.tsx`)
   - Renders document processing results
   - Displays detection, validation, and analysis

### Data Flow

```
User uploads document + types prompt
         ↓
    PromptUI.tsx
         ↓
   pages/index.tsx (handleSendMessage)
         ↓
   useCognify.ts (worker communication)
         ↓
   ai.worker.ts
         ↓
   orchestrator.ts
         ↓
   document/processor.ts
         ↓
   ┌──────────┬──────────┬──────────┐
   │          │          │          │
detector  validator  analyzer
   │          │          │          │
   └──────────┴──────────┴──────────┘
         ↓
   Combined Result
         ↓
   Back through worker
         ↓
   ChatView.tsx (renders result)
```

## Error Handling

- If document processing fails, the system falls back to regular LLM processing
- Invalid file types show helpful error messages
- PDF/DOCX support is gracefully handled with "not yet implemented" messages

## Future Enhancements

1. **PDF Support**
   - Install `pdf-parse` or `pdfjs-dist`
   - Implement text extraction from PDF files

2. **DOCX Support**
   - Install `mammoth` or `docx` library
   - Parse Word document structure

3. **OCR Support**
   - Install `tesseract.js`
   - Extract text from scanned documents and images

4. **Advanced Validation**
   - Digital signature verification
   - Metadata analysis
   - Cross-document comparison
   - Blockchain verification

5. **Export Features**
   - Generate validation reports
   - Export analysis results
   - PDF report generation

## Testing

To test the document processing feature:

1. Create a sample text file with invoice content
2. Upload it in the application
3. Type: "Analyze this document"
4. Verify all three responses are displayed

Example test file content:
```
INVOICE

Invoice #: INV-2024-001
Date: March 8, 2024
Due Date: April 8, 2024

Bill To:
John Doe
123 Main St
City, State 12345

Services Rendered:
- Consulting Services: $2,000
- Project Management: $500

Subtotal: $2,500
Tax (10%): $250
Total: $2,750

Payment Terms: Net 30 days
```
