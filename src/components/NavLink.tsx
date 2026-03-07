import { useState, useRef, useEffect, useCallback } from "react"
import { ModelCategory, VideoCapture } from "@runanywhere/web"
import { VLMWorkerBridge } from "@runanywhere/web-llamacpp"
import { useModelLoader } from "@/hooks/useModelLoader"
import ChatView from "@/components/ChatView"

const LIVE_INTERVAL_MS = 2500
const LIVE_MAX_TOKENS = 30
const SINGLE_MAX_TOKENS = 80
const CAPTURE_DIM = 256

interface VisionResult {
  text: string
  totalMs: number
}

export function VisionTab() {

  const loader = useModelLoader(ModelCategory.Multimodal)

  const [cameraActive, setCameraActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [liveMode, setLiveMode] = useState(false)
  const [result, setResult] = useState<VisionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("Describe what you see briefly.")

  const videoMountRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<VideoCapture | null>(null)
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const processingRef = useRef(false)
  const liveModeRef = useRef(false)

  processingRef.current = processing
  liveModeRef.current = liveMode

  // -----------------------------
  // Start Camera
  // -----------------------------
  const startCamera = useCallback(async () => {

    if (captureRef.current?.isCapturing) return

    try {

      const cam = new VideoCapture({ facingMode: "environment" })
      await cam.start()

      captureRef.current = cam

      if (videoMountRef.current) {

        const video = cam.videoElement
        video.style.width = "100%"
        video.style.borderRadius = "12px"

        videoMountRef.current.appendChild(video)
      }

      setCameraActive(true)

    } catch (err) {

      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)

    }

  }, [])

  // -----------------------------
  // Cleanup
  // -----------------------------
  useEffect(() => {

    return () => {

      if (liveIntervalRef.current)
        clearInterval(liveIntervalRef.current)

      const cam = captureRef.current

      if (cam) {

        cam.stop()

        cam.videoElement?.remove()

        captureRef.current = null
      }

    }

  }, [])

  // -----------------------------
  // Vision Inference
  // -----------------------------
  const describeFrame = useCallback(async (maxTokens: number) => {

    if (processingRef.current) return

    const cam = captureRef.current
    if (!cam?.isCapturing) return

    if (loader.state !== "ready") {

      const ok = await loader.ensure()
      if (!ok) return

    }

    const frame = cam.captureFrame(CAPTURE_DIM)
    if (!frame) return

    setProcessing(true)
    setError(null)

    processingRef.current = true

    const start = performance.now()

    try {

      const bridge = VLMWorkerBridge.shared

      const res = await bridge.process(
        frame.rgbPixels,
        frame.width,
        frame.height,
        prompt,
        { maxTokens, temperature: 0.6 }
      )

      setResult({
        text: res.text,
        totalMs: performance.now() - start
      })

    } catch (err) {

      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)

    } finally {

      setProcessing(false)
      processingRef.current = false

    }

  }, [loader, prompt])

  // -----------------------------
  // Single Frame
  // -----------------------------
  const describeSingle = useCallback(async () => {

    if (!captureRef.current?.isCapturing) {
      await startCamera()
      return
    }

    await describeFrame(SINGLE_MAX_TOKENS)

  }, [startCamera, describeFrame])

  // -----------------------------
  // Live Mode
  // -----------------------------
  const startLive = useCallback(async () => {

    if (!captureRef.current?.isCapturing)
      await startCamera()

    setLiveMode(true)

    describeFrame(LIVE_MAX_TOKENS)

    liveIntervalRef.current = setInterval(() => {

      if (!processingRef.current)
        describeFrame(LIVE_MAX_TOKENS)

    }, LIVE_INTERVAL_MS)

  }, [startCamera, describeFrame])

  const stopLive = useCallback(() => {

    setLiveMode(false)

    if (liveIntervalRef.current) {

      clearInterval(liveIntervalRef.current)
      liveIntervalRef.current = null

    }

  }, [])

  const toggleLive = () => {

    if (liveMode)
      stopLive()
    else
      startLive()

  }

  // -----------------------------
  // UI
  // -----------------------------
  return (

    <div className="p-6 space-y-6">

      <ChatView
        state={loader.state}
        progress={loader.progress}
        error={loader.error}
        onLoad={loader.ensure}
        label="Vision Model"
      />

      <div className="rounded-xl border p-4">

        {!cameraActive && (
          <div className="text-center text-gray-400">
            Start camera to analyze images
          </div>
        )}

        <div ref={videoMountRef} />

      </div>

      <input
        className="w-full border rounded p-2"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={liveMode}
      />

      <div className="flex gap-3">

        {!cameraActive ? (

          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={startCamera}
          >
            Start Camera
          </button>

        ) : (

          <>
            <button
              onClick={describeSingle}
              disabled={processing || liveMode}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              {processing ? "Analyzing..." : "Describe"}
            </button>

            <button
              onClick={toggleLive}
              className="px-4 py-2 bg-purple-500 text-white rounded"
            >
              {liveMode ? "Stop Live" : "Live Mode"}
            </button>
          </>

        )}

      </div>

      {error && (
        <div className="text-red-500">
          Error: {error}
        </div>
      )}

      {result && (

        <div className="border rounded p-4">

          <h3 className="font-semibold mb-2">Result</h3>

          <p>{result.text}</p>

          <p className="text-sm text-gray-400 mt-2">
            {(result.totalMs / 1000).toFixed(2)}s
          </p>

        </div>

      )}

    </div>

  )

}