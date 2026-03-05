/**
 * Cognify – RunAnywhere SDK bootstrap
 * Single source of truth for:
 * - SDK initialization
 * - WASM backend registration
 * - Model catalog
 * - VLM worker wiring
 */

import {
  RunAnywhere,
  SDKEnvironment,
  ModelManager,
  ModelCategory,
  LLMFramework,
  type CompactModelDef,
} from "@runanywhere/web";

import { LlamaCPP, VLMWorkerBridge } from "@runanywhere/web-llamacpp";
import { ONNX } from "@runanywhere/web-onnx";

// Vite worker URL
// @ts-ignore
import vlmWorkerUrl from "./workers/vlm-worker?worker&url";

// ---------------------------------------------------------------------------
// Cognify model catalog (SINGLE SOURCE)
// ---------------------------------------------------------------------------

const MODELS: CompactModelDef[] = [
  // 🔹 Text (Code + Documents)
  {
    id: "lfm2-1.2b-tool-q4_k_m",
    name: "Cognify Text Intelligence",
    repo: "LiquidAI/LFM2-1.2B-Tool-GGUF",
    files: ["LFM2-1.2B-Tool-Q4_K_M.gguf"],
    framework: LLMFramework.LlamaCpp,
    modality: ModelCategory.Language,
    memoryRequirement: 800_000_000,
  },

  // 🔹 Vision (Photos + Screenshots)
  {
    id: "lfm2-vl-450m-q4_0",
    name: "Cognify Vision Intelligence",
    repo: "runanywhere/LFM2-VL-450M-GGUF",
    files: [
      "LFM2-VL-450M-Q4_0.gguf",
      "mmproj-LFM2-VL-450M-Q8_0.gguf",
    ],
    framework: LLMFramework.LlamaCpp,
    modality: ModelCategory.Multimodal,
    memoryRequirement: 500_000_000,
  },

  // 🔹 Speech (Optional / demo)
  {
    id: "sherpa-onnx-whisper-tiny.en",
    name: "Cognify Speech-to-Text",
    url: "https://huggingface.co/runanywhere/sherpa-onnx-whisper-tiny.en/resolve/main/sherpa-onnx-whisper-tiny.en.tar.gz",
    framework: LLMFramework.ONNX,
    modality: ModelCategory.SpeechRecognition,
    memoryRequirement: 105_000_000,
    artifactType: "archive",
  },
];

// ---------------------------------------------------------------------------
// Initialization (SAFE, SINGLETON)
// ---------------------------------------------------------------------------

let _initPromise: Promise<void> | null = null;

export async function initSDK(): Promise<void> {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    // 1️⃣ Initialize core SDK (no WASM yet)
    await RunAnywhere.initialize({
      environment: import.meta.env.DEV
        ? SDKEnvironment.Development
        : SDKEnvironment.Production,
      debug: import.meta.env.DEV,
    });

    // 2️⃣ Register WASM backends
    await LlamaCPP.register();
    await ONNX.register();

    // 3️⃣ Register Cognify models
    RunAnywhere.registerModels(MODELS);

    // 4️⃣ Wire VLM worker
    VLMWorkerBridge.shared.workerUrl = vlmWorkerUrl;
    RunAnywhere.setVLMLoader({
      get isInitialized() {
        return VLMWorkerBridge.shared.isInitialized;
      },
      init: () => VLMWorkerBridge.shared.init(),
      loadModel: (params) => VLMWorkerBridge.shared.loadModel(params),
      unloadModel: () => VLMWorkerBridge.shared.unloadModel(),
    });
  })();

  return _initPromise;
}

// ---------------------------------------------------------------------------
// Cognify helpers (used by orchestrator)
// ---------------------------------------------------------------------------

export async function loadTextModel() {
  await initSDK();
  return ModelManager.loadModel("lfm2-1.2b-tool-q4_k_m");
}

export async function loadVisionModel() {
  await initSDK();
  return ModelManager.loadModel("lfm2-vl-450m-q4_0");
}

export function getAccelerationMode(): string | null {
  return LlamaCPP.isRegistered ? LlamaCPP.accelerationMode : null;
}

// Re-exports
export { RunAnywhere, ModelManager, ModelCategory, VLMWorkerBridge };