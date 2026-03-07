import React, { useState } from "react"
import { runModel } from "../../services/ai/modelRegistry"

export default function DocumentUpload() {

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {

    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)

    const text = await file.text()

    const response = await runModel("document", text)

    setResult(response)
    setLoading(false)
  }

  return (
    <div>

      <h2>Upload Document</h2>

      <input
        type="file"
        accept=".txt,.pdf,.doc,.docx"
        onChange={handleUpload}
      />

      {loading && <p>Analyzing document...</p>}

      {result && (
        <div>
          <h3>Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

    </div>
  )
}