import { useScreenshotAnalysis } from "./useScreenshotAnalysis"

export default function ScreenshotUpload() {

  const { analyzeImage, loading } = useScreenshotAnalysis()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {

    const file = e.target.files?.[0]

    if (file) analyzeImage(file)
  }

  return (

    <div className="space-y-4">

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
      />

      {loading && <p>Analyzing image...</p>}

    </div>
  )
}