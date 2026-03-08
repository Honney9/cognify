import { useState } from "react"
import PromptUI from "@/components/PromptUI"
import { useCognify } from "@/hooks/useCognify"

type SendPayload = {
  type: string | null
  prompt: string
  files: File[]
}

export default function CognifyController() {

  const { analyze, loading, error } = useCognify()

  const [result, setResult] = useState<any>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)

  async function handleSend(payload: SendPayload) {

    const { type, prompt, files } = payload

    const res = await analyze({
      type: type?.toLowerCase() ?? null,
      prompt,
      files
    })

    setResult(res)

  }

  return (

    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">

      {/* PROMPT BAR */}

      <PromptUI
        onSend={handleSend}
        onPreviewFile={(file) => setPreviewFile(file)}
      />

      {/* FILE PREVIEW */}

      {previewFile && (

        <div className="border rounded-xl p-4 bg-muted">

          <h3 className="font-semibold mb-2">File Preview</h3>

          {previewFile.type.startsWith("image") ? (

            <img
              src={URL.createObjectURL(previewFile)}
              alt="preview"
              className="max-h-80 rounded-lg"
            />

          ) : (

            <p className="text-sm">{previewFile.name}</p>

          )}

        </div>

      )}

      {/* LOADING */}

      {loading && (

        <div className="text-sm text-muted-foreground">
          Running AI analysis...
        </div>

      )}

      {/* ERROR */}

      {error && (

        <div className="text-red-500 text-sm">
          {error}
        </div>

      )}

      {/* RESULT */}

      {result && (

        <div className="border rounded-xl p-4 bg-black text-green-400 text-sm overflow-auto">

          <pre>{result.result ?? "No AI response"}</pre>

        </div>

      )}

    </div>

  )

}