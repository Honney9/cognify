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
  const deepfakeKeywords = ["ai generated", "deepfake", "fake", "synthetic", "ai-generated", "real or fake"];
  if (deepfakeKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return "deepfake";
  }
  
  // Content tagging keywords
  const taggingKeywords = ["tag", "label", "keywords", "categorize", "classify"];
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
export function generatePrompt(
  intent: PhotoAnalysisIntent,
  userPrompt: string,
  modelContext: { visionFeatures: any; classifierResult: string; isDeepfake: boolean }
): string {
  const context = JSON.stringify(modelContext);
  
  switch (intent) {
    case "deepfake":
      return `Task: Deepfake Detection Analysis
Data: ${context}
User Query: "${userPrompt}"

Analyze if this image is AI-generated or manipulated. Consider:
1. Artifacts from generation models
2. Inconsistencies in lighting or perspective
3. Visual anomalies that suggest synthetic content
4. Classifier confidence patterns

Respond ONLY with valid JSON in this EXACT format:
{
  "type": "deepfake_detection",
  "isDeepfake": true/false,
  "confidence": 0.0-1.0,
  "analysis": "Detailed explanation of why this is/isn't a deepfake"
}`;

    case "tagging":
      return `Task: Content Tagging
Data: ${context}
User Query: "${userPrompt}"

Generate comprehensive tags for this image. Include:
1. Main subjects and objects (minimum 3)
2. Colors, mood, and atmosphere
3. Scene type and location hints
4. Actions or activities present
5. Style or aesthetic categories

Respond ONLY with valid JSON in this EXACT format:
{
  "type": "photo",
  "scene": "Primary scene category",
  "summary": "Brief description of the image content",
  "detectedObjects": ["object1", "object2", "object3", "..."],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "..."],
  "confidence": 0.0-1.0,
  "insights": ["Why these tags were chosen", "Notable patterns or features"]
}

Ensure detectedObjects and tags each contain at least 3 items.`;

    case "scene":
      return `Task: Scene Understanding and Description
Data: ${context}
User Query: "${userPrompt}"

Provide a comprehensive analysis of the scene. Include:
1. Overall scene category (Nature, Urban, Interior, Event, etc.)
2. Main elements and their relationships
3. Environmental context (lighting, time of day, weather)
4. Actions or narrative elements
5. Emotional tone or atmosphere

Respond ONLY with valid JSON in this EXACT format:
{
  "type": "photo",
  "scene": "Broad scene category",
  "summary": "Detailed description of what's happening in the scene",
  "detectedObjects": ["key element 1", "key element 2", "key element 3", "..."],
  "tags": ["contextual tag 1", "tag 2", "tag 3", "..."],
  "confidence": 0.0-1.0,
  "insights": ["Interpretation 1", "Observation 2", "Detail 3"]
}

Ensure detectedObjects has at least 3 items and insights provides meaningful context.`;

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
    summary: response.summary || response.text || response.description || "No description available",
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
