'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface PhotoImage {
  id: string
  url: string
  caption: string | null
  sort_order: number
}

interface PhotoGroup {
  id: string
  title: string
  author_id: string
  is_public: boolean
  created_at: string
  profiles?: { username: string; avatar_url: string | null }
  photo_images?: PhotoImage[]
}

// ─── Lightbox (same as photos/page.tsx) ──────────────────────────────────────
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
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={onClose}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [album, setAlbum] = useState<PhotoGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    async function fetchAlbum() {
      const { data, error } = await supabase
        .from('photo_groups')
        .select('*, profiles(username, avatar_url), photo_images(id, url, caption, sort_order)')
        .eq('id', id)
        .single()

      if (error || !data) {
        setLoading(false)
        return
      }

      setAlbum({
        ...data,
        photo_images: (data.photo_images ?? []).sort(
          (a: PhotoImage, b: PhotoImage) => a.sort_order - b.sort_order
        ),
      })
      setLoading(false)
    }
    fetchAlbum()
  }, [id])

  const images = album?.photo_images ?? []
  const lightboxImages = images.map(img => ({ url: img.url, caption: img.caption }))

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="h-6 w-32 bg-gray-100 rounded animate-pulse mb-8" />
      <div className="h-8 w-64 bg-gray-100 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )

  if (!album) return (
    <div className="max-w-5xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">📷</div>
      <p className="text-gray-500 font-medium mb-1">Album not found</p>
      <p className="text-gray-400 text-sm mb-5">This album may have been removed.</p>
      <button onClick={() => router.push('/photos')}
        className="px-5 py-2.5 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 transition-colors">
        Back to Photos
      </button>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Album header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">{album.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-5 h-5 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-[9px] font-bold overflow-hidden shrink-0">
              {album.profiles?.avatar_url
                ? <img src={album.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                : (album.profiles?.username?.[0]?.toUpperCase() ?? 'U')
              }
            </div>
            <span className="text-sm text-gray-500">{album.profiles?.username ?? 'Anonymous'}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-400">
              {new Date(album.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-400">{images.length} photo{images.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${
          album.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {album.is_public ? '● Public' : '○ Hidden'}
        </span>
      </div>

      {/* Photo grid */}
      {images.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="text-4xl mb-3">📷</div>
          <p className="text-gray-400 text-sm">No photos in this album yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              onClick={() => setLightboxIdx(i)}
              className={`relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100
                ${i === 0 ? 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2' : ''}
              `}
              style={{ aspectRatio: i === 0 ? '1' : '1' }}
            >
              <img
                src={img.url}
                alt={img.caption ?? ''}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Cover badge */}
              {i === 0 && (
                <span className="absolute top-2 left-2 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                  Cover
                </span>
              )}

              {/* Caption overlay on hover */}
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-white text-xs line-clamp-2">{img.caption}</p>
                </div>
              )}

              {/* Expand icon on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-black/40 rounded-full p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  )
}