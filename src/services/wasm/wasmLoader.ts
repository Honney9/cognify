import * as ort from "onnxruntime-web"

let initialized = false

export async function initONNX() {

  if (initialized) return

  ort.env.wasm.wasmPaths = "/assets/"
  ort.env.wasm.numThreads = 1

  initialized = true
}

export async function loadONNXModel(modelPath: string) {

  await initONNX()

  const session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ["wasm"]
  })

  return session
}