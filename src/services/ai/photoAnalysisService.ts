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

export type PhotoAnalysisIntent = "deepfake" | "tagging" | "scene" | "general";

/**
 * Detects user intent from the prompt
 */
export function detectIntent(prompt: string): PhotoAnalysisIntent {
  const lowerPrompt = prompt.toLowerCase();
  
  // Deepfake detection keywords
  const deepfakeKeywords = [ "deepfake",  "ai generated",  "ai-generated",  "synthetic",  "is this fake",  "real or fake"]
  if (deepfakeKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return "deepfake";
  }
  
  // Content tagging keywords
  const taggingKeywords = ["tag", "tagging","label", "labels", "keywords", "categorize", "classify", "identify objects"];
  if (taggingKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return "tagging";
  }
  
  // Scene understanding keywords
  const sceneKeywords = ["describe", "scene", "what is happening", "explain the image", "what's in", "analyze"];
  if (sceneKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return "scene";
  }
  
  // Default to general analysis
  return "general";
}

/**
 * Generates an optimized prompt for the LLM based on intent
 */

type VisionFeatures = {
  objects?: string[]
  colors?: string[]
  environment?: string
  embeddings?: string[]
}

type ModelContext = {
  visionFeatures: VisionFeatures
  classifierResult: string
  isDeepfake: boolean
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
      return `You are an AI scene understanding assistant.

      Image model outputs:
      ${context}

      User request:
      "${userPrompt}"

      Describe what is happening in the image.

      Return ONLY JSON:

      {
      "type":"photo",
      "scene":"scene category",
      "summary":"description of what is happening",
      "detectedObjects":["object1","object2","object3"],
      "tags":["tag1","tag2","tag3"],
      "confidence":0.0-1.0,
      "insights":["important observation"]
      }

      Do not output anything outside the JSON.`;

    case "general":
    default:
      return `Task: General Photo Analysis
Data: ${context}
User Query: "${userPrompt}"

Analyze this photo comprehensively:
1. Identify the scene type (Nature, Urban, Interior, Portrait, Event, etc.)
2. DO NOT default to 'Celebration' unless party/festive items are the main focus
3. If infrastructure (roads, buildings, tracks) is visible, categorize appropriately
4. Detect key objects and elements (minimum 3)
5. Generate relevant descriptive tags
6. Provide contextual insights

Respond ONLY with valid JSON in this EXACT format:
{
  "type": "photo",
  "scene": "Accurate scene category based on visual evidence",
  "summary": "Clear, concise description of the image",
  "detectedObjects": ["object1", "object2", "object3", "..."],
  "tags": ["descriptive", "tag", "list", "..."],
  "confidence": 0.0-1.0,
  "insights": ["Notable observation 1", "Detail 2", "Context 3"]
}

Rules:
- Ensure type is always "photo"
- detectedObjects must contain at least 3 items when possible
- tags should contain at least 3 relevant keywords
- confidence should be between 0 and 1
- insights should explain the analysis reasoning`;
  }
}

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

  // Ensure minimum 3 items in arrays when possible
  if (validated.detectedObjects.length === 0) {
    validated.detectedObjects = ["Unknown object"];
  }
  
  if (validated.tags.length === 0) {
    validated.tags = ["untagged"];
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
