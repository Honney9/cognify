const MODELS = [
  "/models/mobilenet.onnx",
  "/models/efficientnet.onnx",
  "/models/clip.onnx",
];

const CACHE = "cognify-models";

export async function installModels(
  onProgress?: (progress: number) => void
) {
  const cache = await caches.open(CACHE);

  for (let i = 0; i < MODELS.length; i++) {
    const url = MODELS[i];

    const res = await fetch(url);
    await cache.put(url, res.clone());

    onProgress?.((i + 1) / MODELS.length);
  }
}

export async function modelsInstalled() {
  const cache = await caches.open(CACHE);

  for (const m of MODELS) {
    const res = await cache.match(m);
    if (!res) return false;
  }

  return true;
}