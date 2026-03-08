import * as ort from "onnxruntime-web";

ort.env.wasm.numThreads = 1; 
ort.env.wasm.wasmPaths = {
  'ort-wasm-simd-threaded.wasm': '/ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd.wasm': '/ort-wasm-simd.wasm',
  'ort-wasm.wasm': '/ort-wasm.wasm',
  'ort-wasm-simd-threaded.jsep.wasm': '/ort-wasm-simd-threaded.jsep.wasm'
};

let session: ort.InferenceSession | null = null;

async function loadModel() {
  if (!session) {
    const modelPath = "/models/clip.onnx";
    console.log(`[VisionModel] Loading model from: ${modelPath}`);
    
    session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ["wasm"],
    });
  }
  return session;
}

async function preprocessImage(imageBitmap: ImageBitmap) {
  const width = 224;
  const height = 224;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height).data;
  const floatData = new Float32Array(3 * width * height);

  const mean = [0.48145466, 0.4578275, 0.40821073];
  const std = [0.26862954, 0.26130258, 0.27577711];

  for (let i = 0; i < width * height; i++) {
    floatData[i] = ((imgData[i * 4] / 255.0) - mean[0]) / std[0];
    floatData[i + width * height] = ((imgData[i * 4 + 1] / 255.0) - mean[1]) / std[1];
    floatData[i + 2 * width * height] = ((imgData[i * 4 + 2] / 255.0) - mean[2]) / std[2];
  }

  return new ort.Tensor("float32", floatData, [1, 3, width, height]);
}

export async function runVisionModel(imageFile: File | Blob) {
  try {
    const model = await loadModel();
    const imageBitmap = await createImageBitmap(imageFile);
    const tensor = await preprocessImage(imageBitmap);

    const feeds: any = {};
    const inputNames = model.inputNames;

    if (inputNames.includes('pixel_values')) feeds.pixel_values = tensor;
    else if (inputNames.includes('input')) feeds.input = tensor;

    if (inputNames.includes('input_ids')) {
      feeds.input_ids = new ort.Tensor("int64", BigInt64Array.from([0n]), [1, 1]);
    }
    if (inputNames.includes('attention_mask')) {
      feeds.attention_mask = new ort.Tensor("int64", BigInt64Array.from([1n]), [1, 1]);
    }

    const results = await model.run(feeds);
    
    const output: any = {};
    for (const key of Object.keys(results)) {
      // Increased to 32 to provide more distinct features for the LLM to recognize
      output[key] = Array.from(results[key].data as Float32Array).slice(0, 32); 
    }
    return output;
  } catch (error) {
    console.error("[VisionModel] Inference error:", error);
    throw error;
  }
}