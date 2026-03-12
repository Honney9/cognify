import * as ort from "onnxruntime-web";

ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = {
  "ort-wasm-simd-threaded.wasm": "/ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd-threaded.jsep.wasm": "/ort-wasm-simd-threaded.jsep.wasm",
  "ort-wasm-simd-threaded.jspi.wasm": "/ort-wasm-simd-threaded.jspi.wasm",
  "ort-wasm-simd-threaded.asyncify.wasm": "/ort-wasm-simd-threaded.asyncify.wasm",
};



let session: ort.InferenceSession | null = null;

async function loadModel() {
  if (!session) {
    const modelPath = "/models/efficientnet.onnx";

    console.log("[DeepfakeModel] Loading:", modelPath);

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

  const floatData = new Float32Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {

    const r = imgData[i * 4] / 255;
    const g = imgData[i * 4 + 1] / 255;
    const b = imgData[i * 4 + 2] / 255;

    floatData[i * 3] = r;
    floatData[i * 3 + 1] = g;
    floatData[i * 3 + 2] = b;
  }

  return new ort.Tensor("float32", floatData, [1, 224, 224, 3]);
}

export async function runDeepfakeModel(imageFile: File | Blob) {

  const model = await loadModel();

  const imageBitmap = await createImageBitmap(imageFile);

  const tensor = await preprocessImage(imageBitmap);

  imageBitmap.close();

  const feeds: Record<string, any> = {};
  feeds[model.inputNames[0]] = tensor;

  const results = await model.run(feeds);

  const key = Object.keys(results)[0];

  const logits = results[key].data as Float32Array;

const expReal = Math.exp(logits[0]);
const expFake = Math.exp(logits[1]);

const sum = expReal + expFake;

const realScore = expReal / sum;
const fakeScore = expFake / sum;

  const isDeepfake = fakeScore > realScore;

  return {
    isDeepfake,
    confidence: Math.max(realScore, fakeScore),
    realScore,
    fakeScore
  };
}