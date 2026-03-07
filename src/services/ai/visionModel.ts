import * as ort from "onnxruntime-web"

let session: ort.InferenceSession | null = null

async function loadModel() {
  if (!session) {
    session = await ort.InferenceSession.create("/models/clip.onnx")
  }
  return session
}

function preprocessImage(image: ImageBitmap) {

  const canvas = document.createElement("canvas")
  canvas.width = 224
  canvas.height = 224

  const ctx = canvas.getContext("2d")!
  ctx.drawImage(image, 0, 0, 224, 224)

  const imgData = ctx.getImageData(0, 0, 224, 224).data

  const floatData = new Float32Array(3 * 224 * 224)

  for (let i = 0; i < 224 * 224; i++) {
    floatData[i] = imgData[i * 4] / 255
    floatData[i + 224 * 224] = imgData[i * 4 + 1] / 255
    floatData[i + 2 * 224 * 224] = imgData[i * 4 + 2] / 255
  }

  return new ort.Tensor("float32", floatData, [1, 3, 224, 224])
}

export async function runVisionModel(image: ImageBitmap) {

  const model = await loadModel()

  const tensor = preprocessImage(image)

  const feeds = { input: tensor }

  const results = await model.run(feeds)

  return results
}