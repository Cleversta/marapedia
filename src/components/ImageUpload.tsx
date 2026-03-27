'use client'
import { useState } from 'react'

interface Props {
  onUpload: (url: string) => void
  existingUrl?: string
  label?: string
}

export default function ImageUpload({ onUpload, existingUrl, label = 'Upload Image' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string>(existingUrl ?? '')
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.')
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setPreview(data.url)
      onUpload(data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {preview && (
        <div className="mb-3 relative">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
          <button
            type="button"
            onClick={() => { setPreview(''); onUpload('') }}
            className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      )}
      <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
        uploading ? 'border-gray-300 bg-gray-50' : 'border-green-300 bg-green-50 hover:bg-green-100'
      }`}>
        <div className="text-center">
          {uploading ? (
            <p className="text-sm text-gray-500">Uploading...</p>
          ) : (
            <>
              <p className="text-sm text-green-700 font-medium">{label}</p>
              <p className="text-xs text-gray-400">Click to browse — JPG, PNG, GIF (max 10MB)</p>
            </>
          )}
        </div>
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
      </label>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
