export type PrivacyDetection = {
  type: string
  confidence: number
}

export function detectSensitiveContent(text: string): PrivacyDetection[] {

  const sensitiveKeywords = [
    "credit card",
    "passport",
    "id card",
    "bank card",
    "otp",
    "password",
    "certificate",
    "license",
    "signature"
  ]

  const results: PrivacyDetection[] = []

  const lowerText = text.toLowerCase()

  for (const keyword of sensitiveKeywords) {

    if (lowerText.includes(keyword)) {

      results.push({
        type: keyword,
        confidence: 0.9
      })

    }

  }

  return results
}