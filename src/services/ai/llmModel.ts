import * as ort from "onnxruntime-web"

let session: ort.InferenceSession | null = null

async function loadModel() {

  if (!session) {

    console.log("[LLM] Loading Phi-3 Mini...")

    session = await ort.InferenceSession.create(
      "/models/phi3/model.onnx",
      {
        executionProviders: ["wasm"]
      }
    )

    console.log("[LLM] Phi-3 Mini loaded")
  }

  return session
}

export async function runLLM(prompt: string) {

  const model = await loadModel()

  const inputTensor = new ort.Tensor(
    "string",
    [prompt],
    [1]
  )

  const feeds: Record<string, any> = {}

  feeds[model.inputNames[0]] = inputTensor

  const results = await model.run(feeds)

  const output = results[model.outputNames[0]]

  return output.data[0]
}