import { useState } from "react"
import { useCodeAnalysis } from "./useCodeAnalysis"

export default function CodeUpload() {

  const [code, setCode] = useState("")
  const { analyzeCode, loading } = useCodeAnalysis()

  return (

    <div className="space-y-4">

      <textarea
        className="w-full h-60 border p-3 rounded"
        placeholder="Paste your code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => analyzeCode(code)}
      >
        {loading ? "Analyzing..." : "Analyze Code"}
      </button>

    </div>
  )
}