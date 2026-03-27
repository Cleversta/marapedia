'use client'
import { useState } from 'react'

interface UploadedImage {
  url: string
  caption: string
}

interface Props {
  onUpload: (images: UploadedImage[]) => void
  existingImages?: UploadedImage[]
  label?: string
}

export default function ImageUpload({ onUpload, existingImages = [], label = 'Upload Image' }: Props) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    setError('')

    const uploaded: UploadedImage[] = []

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError('One or more files exceed 10MB limit.')
        continue
      }

      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Upload failed')
        uploaded.push({ url: data.url, caption: '' })
      } catch (err: any) {
        setError(err.message)
      }
    }

    const next = [...images, ...uploaded]
    setImages(next)
    onUpload(next)
    setUploading(false)
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index)
    setImages(next)
    onUpload(next)
  }

  function updateCaption(index: number, caption: string) {
    const next = images.map((img, i) => (i === index ? { ...img, caption } : img))
    setImages(next)
    onUpload(next)
  }

  return (
    <div className="space-y-3">
      {/* Image previews */}
      {images.map((img, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="relative">
            <img
              src={img.url}
              alt={`Upload ${i + 1}`}
              className="w-full h-40 object-cover"
            />
            {/* Cover badge on first image */}
            {i === 0 && (
              <span className="absolute top-2 left-2 bg-green-700 text-white text-xs px-2 py-0.5 rounded-full">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
          <input
            type="text"
            value={img.caption}
            onChange={e => updateCaption(i, e.target.value)}
            placeholder="Add a caption (optional)"
            className="w-full px-3 py-1.5 text-xs border-t border-gray-200 focus:outline-none focus:border-green-500 bg-gray-50"
          />
        </div>
      ))}

      {/* Upload drop area */}
      <label
        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-green-300 bg-green-50 hover:bg-green-100'
        }`}
      >
        <div className="text-center px-4">
          {uploading ? (
            <p className="text-sm text-gray-500">Uploading...</p>
          ) : (
            <>
              <p className="text-sm text-green-700 font-medium">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Select one or multiple images — JPG, PNG, GIF, WEBP (max 10MB each)
              </p>
              {images.length > 0 && (
                <p className="text-xs text-green-600 mt-0.5">
                  {images.length} image{images.length > 1 ? 's' : ''} uploaded · First image is the cover
                </p>
              )}
            </>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFile}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}