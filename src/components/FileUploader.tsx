import { useRef } from "react"

type Props = {
  onFileSelect: (file: File) => void
  accept?: string
}

export default function FileUploader({ onFileSelect, accept }: Props) {

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {

    const file = e.target.files?.[0]
    if (!file) return

    onFileSelect(file)
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
      />

      <button onClick={openFilePicker}>
        Upload File
      </button>
    </>
  )
}