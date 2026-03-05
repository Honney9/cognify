import { CognifyOrchestrator } from "../services/orchestrator";

const orchestrator = new CognifyOrchestrator();

export function usePhotoAnalysis() {
  const analyze = async (file: File) => {
    return orchestrator.analyze({
      type: "photo",
      data: file,
    });
  };

  return { analyze };
}