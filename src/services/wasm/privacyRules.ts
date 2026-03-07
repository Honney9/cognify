export type PrivacyDetection = {
  type: string
  confidence: number
}

export function detectSensitiveContent(tags: string[]): PrivacyDetection[] {

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

  for (const tag of tags) {

    const lower = tag.toLowerCase()

    for (const keyword of sensitiveKeywords) {

      if (lower.includes(keyword)) {

        results.push({
          type: keyword,
          confidence: 0.9
        })

      }

    }

  }

  return results
}