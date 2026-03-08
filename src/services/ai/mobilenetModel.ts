import * as ort from "onnxruntime-web";

// Important for Worker compatibility
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
    const modelPath = "/models/mobilenet.onnx";
    console.log(`[MobileNet] Loading model from: ${modelPath}`);
    
    session = await ort.InferenceSession.create(modelPath, {
      // FORCE WASM to prevent GPU 'Device Lost' crashes
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

  for (let i = 0; i < width * height; i++) {
    floatData[i] = imgData[i * 4] / 255.0;
    floatData[i + width * height] = imgData[i * 4 + 1] / 255.0;
    floatData[i + 2 * width * height] = imgData[i * 4 + 2] / 255.0;
  }
  return new ort.Tensor("float32", floatData, [1, 3, width, height]);
}

export async function runMobileNet(imageFile: File | Blob) {
  try {
    const model = await loadModel();
    const imageBitmap = await createImageBitmap(imageFile);
    const tensor = await preprocessImage(imageBitmap);

    const feeds: any = {};
    if (model.inputNames.includes('data')) feeds.data = tensor;
    else if (model.inputNames.includes('input')) feeds.input = tensor;
    else feeds[model.inputNames[0]] = tensor;

    const results = await model.run(feeds);
    
    const output: any = {};
    for (const key of Object.keys(results)) {
      output[key] = Array.from(results[key].data as Float32Array).slice(0, 5);
    }
    return output;
  } catch (error) {
    console.error("[MobileNet] Inference error:", error);
    throw error;
  }
}