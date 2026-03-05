import { useModelLoader } from "../hooks/useModelLoader";
import { ModelCategory } from "@runanywhere/web";
import { useCognify } from "../hooks/useCognify";

export function CodeAnalyzer() {
  const { analyze } = useCognify();

  const {
    state,
    progress,
    error,
    ensure,
  } = useModelLoader(ModelCategory.Language);

  const runAnalysis = async () => {
    const ok = await ensure(); // 🔥 model loading happens here
    if (!ok) return;

    const result = await analyze({
      type: "code",
      data: "function add(a,b){return a+b}",
    });

    console.log(result);
  };

  return (
    <div>
      <button onClick={runAnalysis}>
        {state === "downloading"
          ? `Downloading ${Math.round(progress * 100)}%`
          : state === "loading"
          ? "Loading model..."
          : "Analyze Code"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}