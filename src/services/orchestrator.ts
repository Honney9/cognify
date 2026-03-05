// src/services/orchestrator.ts

import { loadTextModel, loadVisionModel } from "../runanywhere";
import { analyzeCode } from "../ai/codeAI";
import { analyzeDocument } from "../ai/documentAI";
import { analyzeVision } from "../ai/visionAI";
import { runPrivacyScan } from "../wasm/privacyRules";

export type CognifyInput =
  | { type: "code"; data: string }
  | { type: "document"; data: File }
  | { type: "photo"; data: File }
  | { type: "screenshot"; data: File };

export class CognifyOrchestrator {
  async analyze(input: CognifyInput) {
    switch (input.type) {
      case "code":
        return this.handleCode(input.data);

      case "document":
        return this.handleDocument(input.data);

      case "photo":
        return this.handleVision(input.data, "photo");

      case "screenshot":
        return this.handleVision(input.data, "screenshot");

      default:
        throw new Error("Unsupported input type");
    }
  }

  // -----------------------------
  // Handlers
  // -----------------------------

  private async handleCode(code: string) {
    
    // 2️⃣ Run AI analysis
    const aiResult = await analyzeCode(code);

    return {
      type: "code",
      result: aiResult,
    };
  }

  private async handleDocument(file: File) {
    
    const privacy = await runPrivacyScan(file);
    const aiResult = await analyzeDocument(file);

    return {
      type: "document",
      privacy,
      result: aiResult,
    };
  }

  private async handleVision(file: File, mode: "photo" | "screenshot") {
    

    const privacy = await runPrivacyScan(file);
    const aiResult = await analyzeVision(file, { mode });

    return {
      type: mode,
      privacy,
      result: aiResult,
    };
  }
}