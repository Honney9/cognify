import { useState } from "react";
import { useModelLoader } from "../../hooks/useModelLoader";
import { ModelCategory } from "@runanywhere/web";
import { useCognify } from "@/hooks/useCognify";

export function CodeAnalyzer() {

  const { analyze } = useCognify();

  const {
    state,
    progress,
    error,
    ensure,
  } = useModelLoader(ModelCategory.Language);

  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = async () => {

  const ok = await ensure();
  if (!ok) return;

  setAnalyzing(true);

  try {

    const res = await analyze({
      type: "code",
      prompt: code,
      files: []
    });

    setResult(res);

  } catch (err) {

    console.error(err);

  } finally {

    setAnalyzing(false);

  }

};

  return (

    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      <textarea
        placeholder="Paste your code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={8}
      />

      <button onClick={runAnalysis} disabled={analyzing}>

        {state === "downloading"
          ? `Downloading ${Math.round(progress * 100)}%`
          : state === "loading"
          ? "Loading model..."
          : analyzing
          ? "Analyzing..."
          : "Analyze Code"}

      </button>

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {result && (
        <pre style={{ background: "#111", color: "#0f0", padding: "10px" }}>
          {result.result ?? "No analysis result"}
        </pre>
      )}

    </div>

  );

}