'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface PhotoGroup {
  id: string
  title: string
  author_id: string
  created_at: string
  profiles?: { username: string; avatar_url: string | null }
  photo_images?: PhotoImage[]
}

interface PhotoImage {
  id: string
  url: string
  caption: string | null
  sort_order: number
}

interface UploadingImage {
  file: File
  preview: string
  url: string
  caption: string
  uploading: boolean
  progress: number
  compressed: boolean
  originalSize: number
  compressedSize: number
  error?: string
}

const MAX_IMAGES = 10
const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_WIDTH = 1920
const MAX_HEIGHT = 1920
const QUALITY = 0.82

// ─── Image Compression ────────────────────────────────────────────────────────
function compressImage(file: File): Promise<{ blob: Blob; compressed: boolean }> {
  return new Promise((resolve) => {
    // GIFs — skip compression
    if (file.type === 'image/gif') {
      resolve({ blob: file, compressed: false })
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      // Only resize if exceeds max dimensions
      const needsResize = width > MAX_WIDTH || height > MAX_HEIGHT
      if (needsResize) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const outputQuality = file.type === 'image/png' ? undefined : QUALITY

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve({ blob: file, compressed: false }); return }
          // Only use compressed if smaller
          if (blob.size < file.size) {
            resolve({ blob, compressed: needsResize || blob.size < file.size * 0.95 })
          } else {
            resolve({ blob: file, compressed: false })
          }
        },
        outputType,
        outputQuality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ blob: file, compressed: false }) }
    img.src = url
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({
  images, startIndex, onClose
}: {
  images: { url: string; caption?: string | null }[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  const img = images[idx]

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div className="max-w-4xl max-h-[90vh] px-16" onClick={e => e.stopPropagation()}>
        <img src={img.url} alt={img.caption ?? ''} className="max-h-[80vh] max-w-full object-contain rounded-lg" />
        {img.caption && <p className="text-white/70 text-sm text-center mt-3">{img.caption}</p>}
        {images.length > 1 && <p className="text-white/40 text-xs text-center mt-1">{idx + 1} / {images.length}</p>}
      </div>

      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ user, onClose, onSuccess }: {
  user: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [imgs, setImgs] = useState<UploadingImage[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dragCounter = useRef(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFile(blob: Blob, originalFile: File): Promise<string> {
    const fd = new FormData()
    const ext = originalFile.name.split('.').pop() ?? 'jpg'
    const uploadName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    fd.append('file', blob, uploadName)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Upload failed')
    return data.url
  }

  async function processFiles(files: File[]) {
    const remaining = MAX_IMAGES - imgs.length
    const toAdd = files
      .filter(f => ALLOWED.includes(f.type) && f.size <= 10 * 1024 * 1024)
      .slice(0, remaining)
    if (!toAdd.length) return

    const startIdx = imgs.length

    // Add placeholders immediately with previews
    const placeholders: UploadingImage[] = toAdd.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      url: '',
      caption: '',
      uploading: true,
      progress: 0,
      compressed: false,
      originalSize: f.size,
      compressedSize: f.size,
    }))
    setImgs(prev => [...prev, ...placeholders])

    // Process each file: compress then upload
    await Promise.all(toAdd.map(async (file, i) => {
      const globalIdx = startIdx + i
      try {
        // Step 1: Compress
        setImgs(prev => {
          const next = [...prev]
          next[globalIdx] = { ...next[globalIdx], progress: 10 }
          return next
        })

        const { blob, compressed } = await compressImage(file)

        setImgs(prev => {
          const next = [...prev]
          next[globalIdx] = {
            ...next[globalIdx],
            progress: 40,
            compressed,
            compressedSize: blob.size,
          }
          return next
        })

        // Step 2: Upload
        const url = await uploadFile(blob, file)

        setImgs(prev => {
          const next = [...prev]
          next[globalIdx] = { ...next[globalIdx], url, uploading: false, progress: 100 }
          return next
        })
      } catch (err: any) {
        setImgs(prev => {
          const next = [...prev]
          next[globalIdx] = { ...next[globalIdx], uploading: false, progress: 0, error: err.message }
          return next
        })
      }
    }))
  }

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) await processFiles(files)
  }, [imgs])

  async function handleSave() {
    if (!title.trim()) { setError('Please add a title.'); return }
    const ready = imgs.filter(i => i.url && !i.uploading && !i.error)
    if (!ready.length) { setError('Upload at least one image.'); return }
    if (imgs.some(i => i.uploading)) { setError('Wait for uploads to finish.'); return }

    setSaving(true); setError('')
    try {
      const { data: group, error: gErr } = await supabase
        .from('photo_groups')
        .insert({ title: title.trim(), author_id: user.id, thumbnail_url: ready[0].url })
        .select().single()
      if (gErr) throw new Error(gErr.message)

      const { error: imgErr } = await supabase.from('photo_images').insert(
        ready.map((img, i) => ({
          group_id: group.id,
          url: img.url,
          caption: img.caption || null,
          sort_order: i,
          uploaded_by: user.id,
        }))
      )
      if (imgErr) throw new Error(imgErr.message)
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const allDone = imgs.length > 0 && imgs.every(i => !i.uploading)
  const readyCount = imgs.filter(i => i.url).length
  const uploadingCount = imgs.filter(i => i.uploading).length

  // Total savings across all compressed images
  const totalOriginal = imgs.reduce((s, i) => s + i.originalSize, 0)
  const totalCompressed = imgs.reduce((s, i) => s + i.compressedSize, 0)
  const totalSaved = totalOriginal - totalCompressed
  const showSavings = totalSaved > 1024 && allDone

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-0 sm:pb-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-display text-base font-bold text-gray-900">Upload Photos</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Up to {MAX_IMAGES} images · auto-compressed · first becomes cover
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Album title…"
            maxLength={200}
            className="w-full text-lg font-display font-semibold text-gray-900 placeholder:text-gray-300
              border-0 border-b border-gray-200 focus:border-green-500 focus:outline-none pb-2 bg-transparent transition-colors"
          />

          {/* Drop zone */}
          {imgs.length < MAX_IMAGES && (
            <div
              onDragEnter={e => { e.preventDefault(); dragCounter.current++; setDragOver(true) }}
              onDragOver={e => e.preventDefault()}
              onDragLeave={e => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragOver(false) }}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed
                cursor-pointer transition-all duration-150 select-none
                ${dragOver ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/50'}`}
            >
              <svg className={`w-6 h-6 mb-1.5 transition-colors ${dragOver ? 'text-green-600' : 'text-gray-300'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500 font-medium">
                {dragOver ? 'Drop to add' : 'Click or drag images'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {MAX_IMAGES - imgs.length} remaining · JPG PNG GIF WEBP · max 10MB each
              </p>
              {/* Multiple select enabled */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={async e => {
                  const f = Array.from(e.target.files ?? [])
                  if (f.length) await processFiles(f)
                  e.target.value = ''
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Upload progress summary */}
          {uploadingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
              <p className="text-xs text-blue-700 font-medium">
                Compressing & uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}…
              </p>
            </div>
          )}

          {/* Compression savings badge */}
          {showSavings && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
              <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-xs text-green-700 font-medium">
                Saved {formatBytes(totalSaved)} through compression
                <span className="text-green-500 font-normal ml-1">
                  ({formatBytes(totalOriginal)} → {formatBytes(totalCompressed)})
                </span>
              </p>
            </div>
          )}

          {/* Image grid */}
          {imgs.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {imgs.map((img, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  <div className="h-24 relative">
                    <img
                      src={img.preview}
                      alt=""
                      className={`w-full h-full object-cover transition-opacity duration-200 ${img.uploading ? 'opacity-40' : ''}`}
                    />

                    {/* Progress bar */}
                    {img.uploading && (
                      <>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                          <div className="w-5 h-5 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
                          <span className="text-[9px] text-gray-600 font-medium">
                            {img.progress < 40 ? 'Compressing…' : 'Uploading…'}
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                          <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${img.progress}%` }}
                          />
                        </div>
                      </>
                    )}

                    {img.error && (
                      <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center p-1">
                        <p className="text-[9px] text-red-600 text-center leading-tight">{img.error}</p>
                      </div>
                    )}

                    {/* Cover badge */}
                    {i === 0 && !img.error && (
                      <span className="absolute top-1 left-1 bg-green-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                        Cover
                      </span>
                    )}

                    {/* Compression badge */}
                    {!img.uploading && img.compressed && !img.error && (
                      <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] px-1 py-0.5 rounded backdrop-blur-sm">
                        -{Math.round((1 - img.compressedSize / img.originalSize) * 100)}%
                      </span>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(img.preview)
                        setImgs(prev => prev.filter((_, j) => j !== i))
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs
                        flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >×</button>
                  </div>

                  {/* Caption input */}
                  <input
                    type="text"
                    value={img.caption}
                    onChange={e => setImgs(prev => prev.map((im, j) => j === i ? { ...im, caption: e.target.value } : im))}
                    placeholder="Caption…"
                    className="w-full px-1.5 py-1 text-[10px] border-t border-gray-200 bg-white focus:outline-none focus:border-green-400 placeholder:text-gray-300 text-gray-600"
                  />
                </div>
              ))}
            </div>
          )}

          {imgs.length >= MAX_IMAGES && (
            <p className="text-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-2">
              Maximum {MAX_IMAGES} images reached.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0 flex items-center justify-between gap-3 bg-gray-50/60">
          <span className="text-xs text-gray-400">
            {uploadingCount > 0
              ? `Processing ${uploadingCount} image${uploadingCount > 1 ? 's' : ''}…`
              : readyCount > 0
                ? `${readyCount} image${readyCount > 1 ? 's' : ''} ready`
                : 'No images yet'
            }
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !allDone || readyCount === 0 || saving}
              className="px-5 py-2 bg-green-700 text-white rounded-xl text-sm font-medium
                hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed
                active:scale-95 transition-all flex items-center gap-1.5"
            >
              {saving
                ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Saving…</>
                : <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Publish
                  </>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Photo Card ───────────────────────────────────────────────────────────────
function PhotoCard({ group, onOpen }: { group: PhotoGroup; onOpen: (g: PhotoGroup, idx: number) => void }) {
  const images = group.photo_images ?? []
  const cover = images[0]
  const extras = images.slice(1, 4)
  const remaining = images.length - 4

  if (!cover) return null

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-green-300 hover:shadow-md transition-all duration-200 group">
      <div
        className="relative cursor-pointer overflow-hidden"
        style={{ aspectRatio: '4/3' }}
        onClick={() => onOpen(group, 0)}
      >
        <img
          src={cover.url}
          alt={cover.caption ?? group.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {images.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
            {images.length} photos
          </span>
        )}
      </div>

      {extras.length > 0 && (
        <div className={`grid gap-px bg-gray-100 ${extras.length === 1 ? 'grid-cols-1' : extras.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {extras.map((img, i) => (
            <div
              key={img.id}
              className="relative cursor-pointer overflow-hidden bg-gray-200"
              style={{ aspectRatio: '1' }}
              onClick={() => onOpen(group, i + 1)}
            >
              <img src={img.url} alt={img.caption ?? ''} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
              {i === extras.length - 1 && remaining > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">+{remaining + 1}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-3">
        <h3 className="font-display font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{group.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-4 h-4 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-[8px] font-bold overflow-hidden shrink-0">
            {group.profiles?.avatar_url
              ? <img src={group.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              : (group.profiles?.username?.[0]?.toUpperCase() ?? 'U')
            }
          </div>
          <span className="text-xs text-gray-400 truncate">{group.profiles?.username ?? 'Anonymous'}</span>
          <span className="text-gray-200">·</span>
          <span className="text-xs text-gray-400 shrink-0">
            {new Date(group.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PhotosPage() {
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<PhotoGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [lightbox, setLightbox] = useState<{ group: PhotoGroup; idx: number } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => { fetchGroups() }, [])

  async function fetchGroups() {
    setLoading(true)
    const { data } = await supabase
      .from('photo_groups')
      .select('*, profiles(username, avatar_url), photo_images(id, url, caption, sort_order)')
      .order('created_at', { ascending: false })
    if (data) {
      const sorted = data.map(g => ({
        ...g,
        photo_images: (g.photo_images ?? []).sort((a: PhotoImage, b: PhotoImage) => a.sort_order - b.sort_order)
      }))
      setGroups(sorted)
    }
    setLoading(false)
  }

  const lightboxImages = lightbox
    ? (lightbox.group.photo_images ?? []).map(img => ({ url: img.url, caption: img.caption }))
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">📷 Photos</h1>
          <p className="text-sm text-gray-500 mt-0.5">A community photo gallery of the Mara people</p>
        </div>
        {user && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-medium
              hover:bg-green-800 active:scale-95 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Photos
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl animate-pulse" style={{ aspectRatio: '4/3' }} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-24 bg-white border border-dashed border-gray-200 rounded-2xl">
          <div className="text-5xl mb-4">📷</div>
          <p className="text-gray-500 font-medium mb-1">No photos yet</p>
          <p className="text-gray-400 text-sm mb-5">Be the first to share photos of Mara life</p>
          {user ? (
            <button onClick={() => setShowUpload(true)}
              className="px-5 py-2.5 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 transition-colors">
              Upload First Photos
            </button>
          ) : (
            <a href="/login" className="px-5 py-2.5 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 transition-colors">
              Login to Upload
            </a>
          )}
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
          {groups.map(group => (
            <div key={group.id} className="break-inside-avoid">
              <PhotoCard group={group} onOpen={(g, idx) => setLightbox({ group: g, idx })} />
            </div>
          ))}
        </div>
      )}

      {!user && groups.length > 0 && (
        <div className="mt-10 text-center py-6 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-sm text-gray-500">
            Want to share your photos?{' '}
            <a href="/login" className="text-green-700 font-medium hover:underline">Login</a>
            {' '}or{' '}
            <a href="/register" className="text-green-700 font-medium hover:underline">Register</a>
          </p>
        </div>
      )}

      {showUpload && user && (
        <UploadModal
          user={user}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchGroups() }}
        />
      )}

      {lightbox && lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          startIndex={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}