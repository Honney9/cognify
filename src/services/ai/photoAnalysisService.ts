/**
 * Photo Analysis Service
 * 
 * Provides AI-powered photo analysis including:
 * - Deepfake detection
 * - Content tagging
 * - Scene understanding
 */

export type PhotoSceneResponse = {
  success: boolean;
  type: "photo";
  scene: string;
  summary: string;
  detectedObjects: string[];
  tags: string[];
  confidence?: number;
  insights?: string[];
};

export type DeepfakeResponse = {
  success: boolean;
  type: "deepfake_detection";
  isDeepfake: boolean;
  confidence: number;
  analysis: string;
};

export type PhotoAnalysisIntent = "deepfake" | "tagging" | "scene" | "general" | "document";

/**
 * Detects user intent from the prompt
 */
export function detectIntent(prompt: string): PhotoAnalysisIntent {
  const p = prompt.toLowerCase();

  // 🔥 DOCUMENT
  if (
    p.includes("document") ||
    p.includes("resume") ||
    p.includes("pdf") ||
    p.includes("text extraction") ||
    p.includes("summarize document")
  ) {
    return "document";
  }

  // 🔥 DEEPFAKE
  if (
    p.includes("deepfake") ||
    p.includes("fake image") ||
    p.includes("real or fake")
  ) {
    return "deepfake";
  }

  // 🔥 TAGGING
  if (
    p.includes("tags") ||
    p.includes("objects") ||
    p.includes("detect")
  ) {
    return "tagging";
  }

  // 🔥 SCENE
  if (
    p.includes("scene") ||
    p.includes("what is happening") ||
    p.includes("context")
  ) {
    return "scene";
  }

  return "general";
}

/**
 * Generates an optimized prompt for the LLM based on intent
 */


type ModelContext = {
  objects: string[]
  scene: string
  imageType: string
  hints?: {
    isNature?: boolean
    isIndoor?: boolean
    objectCount?: number
  }
}
export function generatePrompt(
  intent: PhotoAnalysisIntent,
  userPrompt: string,
  modelContext: ModelContext
): string {
  const context = JSON.stringify(modelContext);
  
  switch (intent) {
    case "deepfake":
      return `You are an AI deepfake detection assistant.

    Image model outputs:
    ${context}

    User request:
    "${userPrompt}"

    Determine whether the image is AI-generated or manipulated.

    Return ONLY JSON:

    {
    "type":"deepfake_detection",
    "isDeepfake": true or false,
    "confidence": 0.0-1.0,
    "analysis":"short explanation of why the image may be real or fake"
    }

    Rules:
    - confidence must be between 0 and 1
    - do not output anything outside JSON`;

    case "tagging":
     return `You are an AI image tagging system.

Vision model analysis:
${context}

User request:
"${userPrompt}"

Analyze the image and generate descriptive tags.

Return ONLY valid JSON in this EXACT structure:

{
  "type": "photo",
  "scene": "short scene category",
  "summary": "One natural sentence describing the image and its tags",
  "detectedObjects": ["object1", "object2", "object3"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidence": 0.0
}

Important rules:
- tags must be simple strings (NOT objects)
- detectedObjects must contain at least 3 items
- tags must contain 5 descriptive words
- confidence must be between 0 and 1
- do not output anything outside JSON
- do not create nested objects inside tags`;

    case "scene":
        return `
      You are an advanced scene understanding AI.

      Vision input:
      ${context}

      User request:
      "${userPrompt}"

      Infer what is happening in this image.

      Focus on:
      - Environment (indoor/outdoor/nature/urban)
      - Activity or situation
      - Visual mood

      Return ONLY JSON:

      {
        "type": "photo",
        "scene": "specific scene name",
        "summary": "what is happening in a natural sentence",
        "detectedObjects": ["key objects"],
        "tags": ["relevant tags"],
        "confidence": 0.8,
        "insights": [
          "what this scene suggests",
          "possible context"
        ]
      }
`;

    case "general":
      default:
        return `
      You are an expert AI for real-world scene understanding.

      Input data from vision system:
      ${context}

      User query:
      "${userPrompt}"

      Your job:
      - Understand the REAL WORLD scene (not just objects)
      - Combine objects + environment to infer context
      - Describe like a human (natural, not robotic)
      - Infer mood, setting, and possible use-case

      Important:
      - DO NOT say "AI detected"
      - You may refine or improve object names, not just copy them
      - Be natural and specific

      Return ONLY valid JSON:

      {
        "type": "photo",
        "scene": "clear high-level scene (e.g., Mountain Landscape, Office Workspace, Street View)",
        "summary": "natural human-like description",
        "detectedObjects": ["refined objects"],
        "tags": ["meaningful", "descriptive", "keywords"],
        "confidence": 0.85,
        "insights": [
          "contextual observation",
          "environment insight",
          "possible use or meaning"
        ]
`}
}
;
/**
 * Validates and ensures the response matches the expected format
 */
export function validatePhotoResponse(response: any): PhotoSceneResponse {
  // Ensure required fields exist

  const validated: PhotoSceneResponse = {
    success: true,
    type: "photo",
    scene: response.scene || "Unknown Scene",
    summary: response.summary || response.text || response.description || response.caption || "No description available",
    detectedObjects: Array.isArray(response.detectedObjects) ? response.detectedObjects : [],
    tags: Array.isArray(response.tags) ? response.tags : [],
    confidence: typeof response.confidence === "number" ? response.confidence : 0.75,
    insights: Array.isArray(response.insights) ? response.insights : undefined
  };
  
  validated.tags = [
    ...new Set(
      validated.tags
        .filter((t) => typeof t === "string")
        .map((t) => t.toLowerCase())
    )
  ];
  // Ensure minimum 3 items in arrays when possible
  if (validated.detectedObjects.length === 0) {
    validated.detectedObjects = ["Unknown object"];
  }
  
  if (validated.tags.length === 0) {
    validated.tags = validated.detectedObjects.slice(0,3);
  }

  // Clamp confidence between 0 and 1
  if (validated.confidence !== undefined) {
    validated.confidence = Math.max(0, Math.min(1, validated.confidence));
  }

  return validated;
}

/**
 * Parses LLM response and extracts JSON
 */
export function extractJSON(llmResponse: string): any {
  try {
    // Remove markdown code blocks
    const cleaned = llmResponse.replace(/```json|```/g, "").trim();
    
    // Find JSON boundaries
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error("No JSON found in response");
    }
    
    const jsonString = cleaned.substring(start, end + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON extraction error:", error);
    throw new Error("Failed to extract valid JSON from LLM response");
  }
}
