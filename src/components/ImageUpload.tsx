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
  theme?: 'green' | 'rose'
}

const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.82

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    if (file.type === 'image/gif') { resolve(file); return }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)

      const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const outQuality = file.type === 'image/png' ? undefined : JPEG_QUALITY

      canvas.toBlob(
        (blob) => resolve(blob && blob.size < file.size ? blob : file),
        outType,
        outQuality
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface ProcessingFile {
  name: string
  status: 'compressing' | 'uploading' | 'done' | 'error'
  originalSize: number
  compressedSize?: number
  error?: string
}

export default function ImageUpload({
  onUpload,
  existingImages = [],
  label = 'Upload Image',
  theme = 'green',
}: Props) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages)
  const [processing, setProcessing] = useState<ProcessingFile[]>([])
  const [error, setError] = useState('')

  const isUploading = processing.some(p => p.status === 'compressing' || p.status === 'uploading')

  // ── Theme tokens ─────────────────────────────────────────────────────────
  const t = {
    border:      theme === 'rose' ? 'border-rose-300'       : 'border-green-300',
    bg:          theme === 'rose' ? 'bg-rose-50'             : 'bg-green-50',
    bgHover:     theme === 'rose' ? 'hover:bg-rose-100'      : 'hover:bg-green-100',
    text:        theme === 'rose' ? 'text-rose-700'          : 'text-green-700',
    cover:       theme === 'rose' ? 'bg-rose-500'            : 'bg-green-700',
    focusBorder: theme === 'rose' ? 'focus:border-rose-400'  : 'focus:border-green-500',
    savingsBg:   theme === 'rose' ? 'bg-rose-50 border-rose-100'   : 'bg-green-50 border-green-100',
    savingsText: theme === 'rose' ? 'text-rose-700'          : 'text-green-700',
    savingsIcon: theme === 'rose' ? 'text-rose-500'          : 'text-green-600',
    savingsMuted:theme === 'rose' ? 'text-rose-400'          : 'text-green-500',
    spinner:     theme === 'rose' ? 'border-rose-500'        : 'border-green-500',
    check:       theme === 'rose' ? 'text-rose-500'          : 'text-green-500',
    imageCount:  theme === 'rose' ? 'text-rose-600'          : 'text-green-600',
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''

    const valid = files.filter(f => f.size <= 10 * 1024 * 1024)
    const tooBig = files.filter(f => f.size > 10 * 1024 * 1024)

    if (tooBig.length) setError(`${tooBig.length} file(s) exceed 10MB and were skipped.`)
    else setError('')

    if (!valid.length) return

    const entries: ProcessingFile[] = valid.map(f => ({
      name: f.name,
      status: 'compressing',
      originalSize: f.size,
    }))
    setProcessing(entries)

    const uploaded: UploadedImage[] = []

    await Promise.all(valid.map(async (file, i) => {
      try {
        const blob = await compressImage(file)

        setProcessing(prev => prev.map((p, j) =>
          j === i ? { ...p, status: 'uploading', compressedSize: blob.size } : p
        ))

        const ext = file.name.split('.').pop() ?? 'jpg'
        const uploadName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const fd = new FormData()
        fd.append('file', blob, uploadName)

        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Upload failed')

        uploaded.push({ url: data.url, caption: '' })

        setProcessing(prev => prev.map((p, j) =>
          j === i ? { ...p, status: 'done' } : p
        ))
      } catch (err: any) {
        setProcessing(prev => prev.map((p, j) =>
          j === i ? { ...p, status: 'error', error: err.message } : p
        ))
      }
    }))

    const next = [...images, ...uploaded]
    setImages(next)
    onUpload(next)

    setTimeout(() => setProcessing([]), 2000)
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

  const doneProcesing = processing.filter(p => p.status === 'done' && p.compressedSize !== undefined)
  const totalOriginal = doneProcesing.reduce((s, p) => s + p.originalSize, 0)
  const totalCompressed = doneProcesing.reduce((s, p) => s + (p.compressedSize ?? p.originalSize), 0)
  const saved = totalOriginal - totalCompressed
  const showSavings = saved > 1024 && processing.every(p => p.status === 'done')

  return (
    <div className="space-y-3">

      {/* ── Image previews ──────────────────────────────────────────────────── */}
      {images.map((img, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="relative">
            <img src={img.url} alt={`Upload ${i + 1}`} className="w-full h-40 object-cover" />
            {i === 0 && (
              <span className={`absolute top-2 left-2 ${t.cover} text-white text-xs px-2 py-0.5 rounded-full`}>
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
            className={`w-full px-3 py-1.5 text-xs border-t border-gray-200 focus:outline-none ${t.focusBorder} bg-gray-50`}
          />
        </div>
      ))}

      {/* ── Per-file progress ───────────────────────────────────────────────── */}
      {processing.length > 0 && (
        <div className="space-y-1.5">
          {processing.map((p, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              {p.status === 'compressing' || p.status === 'uploading' ? (
                <div className={`w-3.5 h-3.5 rounded-full border-2 ${t.spinner} border-t-transparent animate-spin shrink-0`} />
              ) : p.status === 'done' ? (
                <svg className={`w-3.5 h-3.5 ${t.check} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}

              <span className="text-xs text-gray-600 truncate flex-1">{p.name}</span>

              <span className="text-xs text-gray-400 shrink-0">
                {p.status === 'compressing' && 'Compressing…'}
                {p.status === 'uploading' && (
                  p.compressedSize !== undefined && p.compressedSize < p.originalSize
                    ? `Uploading · saved ${formatBytes(p.originalSize - p.compressedSize)}`
                    : 'Uploading…'
                )}
                {p.status === 'done' && (
                  p.compressedSize !== undefined && p.compressedSize < p.originalSize
                    ? <span className={t.check}>
                        -{Math.round((1 - p.compressedSize / p.originalSize) * 100)}% · {formatBytes(p.compressedSize)}
                      </span>
                    : <span className="text-gray-400">{formatBytes(p.originalSize)}</span>
                )}
                {p.status === 'error' && <span className="text-red-500">{p.error}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Savings summary ─────────────────────────────────────────────────── */}
      {showSavings && (
        <div className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${t.savingsBg}`}>
          <svg className={`w-3.5 h-3.5 ${t.savingsIcon} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className={`text-xs font-medium ${t.savingsText}`}>
            Saved {formatBytes(saved)} through compression
            <span className={`font-normal ml-1 ${t.savingsMuted}`}>
              ({formatBytes(totalOriginal)} → {formatBytes(totalCompressed)})
            </span>
          </p>
        </div>
      )}

      {/* ── Upload area ─────────────────────────────────────────────────────── */}
      <label
        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isUploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : `${t.border} ${t.bg} ${t.bgHover}`
        }`}
      >
        <div className="text-center px-4">
          {isUploading ? (
            <p className="text-sm text-gray-500">Processing…</p>
          ) : (
            <>
              <p className={`text-sm font-medium ${t.text}`}>{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                JPG, PNG, GIF, WEBP · max 10MB each · auto-compressed
              </p>
              {images.length > 0 && (
                <p className={`text-xs mt-0.5 ${t.imageCount}`}>
                  {images.length} image{images.length > 1 ? 's' : ''} · First is the cover
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
          disabled={isUploading}
          className="hidden"
        />
      </label>

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}