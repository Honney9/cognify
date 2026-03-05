import { CognifyOrchestrator } from "../services/orchestrator";

const orchestrator = new CognifyOrchestrator();

export function useCognify() {
  const analyze = async (input: Parameters<typeof orchestrator.analyze>[0]) => {
    return orchestrator.analyze(input);
  };

  return { analyze };
}