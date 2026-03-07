import { useEffect, useState } from "react";
import { installModels, modelsInstalled } from "@/services/modelInstaller";

export default function ModelManager() {

  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function check() {
      const installed = await modelsInstalled();
      if (!installed) setVisible(true);
    }
    check();
  }, []);

  async function handleInstall() {

    setInstalling(true);

    await installModels((p) => {
      setProgress(p);
    });

    setInstalling(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50">

      <div className="
        w-[420px]
        rounded-xl
        border
        shadow-xl
        p-6

        bg-white
        border-gray-200
        text-gray-900

        dark:bg-zinc-900
        dark:border-zinc-700
        dark:text-white
      ">

        <h2 className="text-lg font-semibold mb-2">
          Install AI Models
        </h2>

        <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
          Download models once to enable offline AI.
        </p>

        {/* Progress Bar */}

        <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded mb-3">
          <div
            className="h-2 bg-purple-600 rounded transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="text-sm mb-4">
          {Math.round(progress * 100)}%
        </div>

        <button
          onClick={handleInstall}
          disabled={installing}
          className="
            w-full
            py-2
            rounded-md
            bg-purple-600
            hover:bg-purple-700
            text-white
            transition
          "
        >
          {installing ? "Downloading..." : "Download Models"}
        </button>

      </div>

    </div>
  );
}