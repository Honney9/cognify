import { useState } from "react"
import FileUploader from "../../components/FileUploader"
import { useCodeAnalysis } from "./useCodeAnalysis"
import CodeResults from "./CodeResults"

export default function CodeUpload() {

  const { analyzeCode, result, loading } = useCodeAnalysis()
  const [file, setFile] = useState<File | null>(null)

  async function handleFile(file: File) {

    setFile(file)

    const text = await file.text()

    analyzeCode(text)
  }

  return (

    <div>

      <FileUploader
        onFileSelect={handleFile}
        accept=".js,.ts,.py,.java,.cpp,.txt"
      />

      {loading && <p>Analyzing code...</p>}

      {result && <CodeResults result={result} />}

    </div>

  )

}