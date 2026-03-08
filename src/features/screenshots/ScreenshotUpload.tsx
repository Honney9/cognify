import { useScreenshotAnalysis } from "./useScreenshotAnalysis"
import FileUploader from "../../components/FileUploader"

export default function ScreenshotUpload() {

  const { analyzeImage, result, loading, error } = useScreenshotAnalysis()

  async function handleFile(file: File) {

    await analyzeImage(file)

  }

  return (

    <div className="space-y-4">

      <FileUploader
        onFileSelect={handleFile}
        accept="image/png,image/jpeg"
      />

      {loading && (
        <p>Analyzing screenshot...</p>
      )}

      {error && (
        <p className="text-red-500">{error}</p>
      )}

      {result && (

        <div className="border rounded p-3">

          <h3 className="font-semibold">Analysis Result</h3>

          <pre className="text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>

        </div>

      )}

    </div>

  )

}