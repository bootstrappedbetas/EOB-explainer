import { useRef } from 'react'

export default function UploadZone({
  isUploading = false,
  statusMessage = '',
  onFilesSelected,
}) {
  const inputRef = useRef(null)

  function handleClick() {
    inputRef.current?.click()
  }

  function handleChange(event) {
    const files = Array.from(event.target.files || [])
    if (files.length && onFilesSelected) {
      onFilesSelected(files)
    }
    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files || [])
    if (files.length && onFilesSelected) {
      onFilesSelected(files)
    }
  }

  function handleDragOver(event) {
    event.preventDefault()
  }

  return (
    <div
      className="upload-zone"
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleClick()
        }
      }}
      aria-label="Upload Explanation of Benefits PDF"
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleChange}
        className="upload-zone__input"
      />
      <div className="upload-zone__content">
        <span className="upload-zone__badge">PDF</span>
        <div>
          <p className="upload-zone__title">Drop your EOB PDFs here</p>
          <p className="upload-zone__subtitle">or click to browse files</p>
        </div>
      </div>
      {statusMessage && <p className="upload-zone__status">{statusMessage}</p>}
      {!statusMessage && isUploading && <p className="upload-zone__status">Uploading…</p>}
    </div>
  )
}
