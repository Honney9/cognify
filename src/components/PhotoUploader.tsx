import { usePhotoAnalysis } from "../hooks/usePhotoAnalysis";

export function PhotoUploader() {
  const { analyze } = usePhotoAnalysis();

  return (
    <input
      type="file"
      accept="image/*"
      onChange={async (e) => {
        if (!e.target.files) return;
        const result = await analyze(e.target.files[0]);
        console.log(result);
      }}
    />
  );
}