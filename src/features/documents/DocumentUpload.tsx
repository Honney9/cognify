import { useDocumentAnalysis } from "./useDocumentAnalysis"
import FileUploader from "../../components/FileUploader"

export default function DocumentUpload() {

  const { analyzeDocument, result } = useDocumentAnalysis()

  async function handleFile(file: File) {

    const text = await file.text()

    analyzeDocument(text)
  }

  return (

    <div>

      <FileUploader
        onFileSelect={handleFile}
        accept=".pdf,.txt,.doc,.docx,.csv"
      />

      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}

    </div>

  )

}