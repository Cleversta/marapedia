'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCategoryInfo, getArticleTypeLabel, formatDate, LANGUAGES } from '@/lib/utils'
import SongViewer from '@/components/SongViewer'
import type { Article, Language, ArticleRevision } from '@/types'

interface ArticleImage { url: string; caption: string | null }

export default function ArticlePage() {
  const { slug } = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [currentLang, setCurrentLang] = useState<Language>('english')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [revisions, setRevisions] = useState<ArticleRevision[]>([])
  const [showRevisions, setShowRevisions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<ArticleImage[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data))
      }
    })
    fetchArticle()
  }, [slug])

  async function fetchArticle() {
    const { data } = await supabase
      .from('articles')
      .select('*, profiles(*), article_translations(*)')
      .eq('slug', slug)
      .single()

    if (!data) { router.push('/'); return }
    setArticle(data)
    await supabase.from('articles').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', data.id)

    const available = data.article_translations?.map((t: any) => t.language) ?? []
    if (available.includes('english')) setCurrentLang('english')
    else if (available.length > 0) setCurrentLang(available[0])

    const { data: imgs } = await supabase
      .from('images').select('url, caption').eq('article_id', data.id).order('created_at', { ascending: true })

    if (imgs && imgs.length > 0) {
      setImages(imgs)
    } else if (data.thumbnail_url) {
      setImages([{ url: data.thumbnail_url, caption: null }])
    }

    setLoading(false)
  }

  async function fetchRevisions() {
    if (!article) return
    const { data } = await supabase
      .from('article_revisions')
      .select('*, profiles(username)')
      .eq('article_id', article.id)
      .eq('language', currentLang)
      .order('edited_at', { ascending: false })
      .limit(20)
    setRevisions(data ?? [])
    setShowRevisions(true)
  }

  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? Math.min(i + 1, images.length - 1) : null)
      if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, images.length])

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-16 text-center"><p className="text-gray-400">Loading...</p></div>
  if (!article) return null

  const translation = article.article_translations?.find(t => t.language === currentLang)
  const availableLangs = article.article_translations?.map(t => t.language) ?? []
  const cat = getCategoryInfo(article.category)
  const canEdit = user && (profile?.role === 'admin' || article.author_id === user.id)
  const isSong = article.category === 'songs'
  const isPoem = article.category === 'poems'
  const showImages = images.length > 0 && !isSong && !isPoem

  const typeLabel = getArticleTypeLabel(article.category, (article as any).article_type)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-green-700">Home</Link>
        <span>/</span>
        <Link href={`/category/${article.category}`} className="hover:text-green-700">{cat.label}</Link>
        {typeLabel && (
          <>
            <span>/</span>
            <span className="text-gray-500">{typeLabel}</span>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600">{translation?.title ?? slug}</span>
      </nav>

      {/* Category badge + type badge + edit */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${cat.color}`}>
          {cat.icon} {cat.label}
        </span>
        {typeLabel && (
          <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
            {typeLabel}
          </span>
        )}
        {canEdit && (
          <Link href={`/articles/edit/${article.slug}`}
            className="text-xs px-3 py-0.5 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600">
            ✏️ Edit
          </Link>
        )}
      </div>

      {/* Language tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {LANGUAGES.map(lang => {
          const hasContent = availableLangs.includes(lang.value)
          const isActive = currentLang === lang.value
          return (
            <button key={lang.value} onClick={() => hasContent && setCurrentLang(lang.value)}
              className={`px-4 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors ${
                isActive ? 'border-green-700 text-green-700 font-medium'
                : hasContent ? 'border-transparent text-gray-500 hover:text-gray-800'
                : 'border-transparent text-gray-300 cursor-not-allowed'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasContent ? 'bg-green-500' : 'bg-gray-300'}`} />
              {lang.label}
              {!hasContent && <span className="text-xs text-gray-300">(empty)</span>}
            </button>
          )
        })}
      </div>

      {/* Image gallery */}
      {showImages && (
        <div className="mb-6">
          {images.length === 1 ? (
            <div className="rounded-xl overflow-hidden cursor-zoom-in" onClick={() => setLightboxIndex(0)}>
              <img src={images[0].url} alt={images[0].caption ?? translation?.title ?? ''} className="w-full max-h-80 object-cover hover:opacity-95 transition-opacity" />
              {images[0].caption && <p className="text-xs text-gray-400 text-center mt-1.5 italic">{images[0].caption}</p>}
            </div>
          ) : images.length === 2 ? (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img, i) => (
                <div key={i} className="cursor-zoom-in" onClick={() => setLightboxIndex(i)}>
                  <img src={img.url} alt={img.caption ?? `Image ${i + 1}`} className="w-full h-56 object-cover rounded-xl hover:opacity-95 transition-opacity" />
                  {img.caption && <p className="text-xs text-gray-400 text-center mt-1 italic">{img.caption}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="cursor-zoom-in rounded-xl overflow-hidden" onClick={() => setLightboxIndex(0)}>
                <img src={images[0].url} alt={images[0].caption ?? translation?.title ?? ''} className="w-full max-h-72 object-cover hover:opacity-95 transition-opacity" />
                {images[0].caption && <p className="text-xs text-gray-400 text-center mt-1 italic">{images[0].caption}</p>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {images.slice(1).map((img, i) => (
                  <div key={i + 1} className="relative cursor-zoom-in" onClick={() => setLightboxIndex(i + 1)}>
                    <img src={img.url} alt={img.caption ?? `Image ${i + 2}`} className="w-full h-28 object-cover rounded-lg hover:opacity-95 transition-opacity" />
                    {img.caption && <p className="text-xs text-gray-400 text-center mt-1 italic truncate">{img.caption}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {translation ? (
        <>
          <h1 className={`font-display font-bold mb-3 ${isSong ? 'text-2xl' : isPoem ? 'text-3xl text-center' : 'text-3xl md:text-4xl'}`}>
            {translation.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8 pb-4 border-b border-gray-100">
            <span>By <strong className="text-gray-600">{article.profiles?.username ?? 'Anonymous'}</strong></span>
            <span>Updated {formatDate(article.updated_at ?? article.created_at)}</span>
            <span>{article.view_count ?? 0} views</span>
            {images.length > 0 && <span>{images.length} image{images.length > 1 ? 's' : ''}</span>}
            <button onClick={fetchRevisions} className="text-green-700 hover:underline text-xs">View history</button>
          </div>

          {isSong ? (
            <SongViewer content={translation.content ?? ''} title={translation.title ?? ''} />
          ) : isPoem ? (
            <div className="max-w-xl mx-auto">
              <div className="poem-content font-display text-lg leading-[1.9rem] text-gray-800 whitespace-pre-wrap text-center"
                dangerouslySetInnerHTML={{
                  __html: (translation.content ?? '')
                    .replace(/<p>/g, '').replace(/<\/p>/g, '\n')
                    .replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
                }} />
            </div>
          ) : (
            <div className="article-content" dangerouslySetInnerHTML={{ __html: translation.content ?? '' }} />
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-400 mb-2">
            This article has not been written in {LANGUAGES.find(l => l.value === currentLang)?.label} yet.
          </p>
          {user && (
            <Link href={`/articles/edit/${article.slug}?lang=${currentLang}`}
              className="text-sm px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
              Write {LANGUAGES.find(l => l.value === currentLang)?.label} version
            </Link>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setLightboxIndex(null)}>
          {lightboxIndex > 0 && (
            <button onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors">‹</button>
          )}
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={images[lightboxIndex].url} alt={images[lightboxIndex].caption ?? `Image ${lightboxIndex + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-lg" />
            {images[lightboxIndex].caption && (
              <p className="text-white/70 text-sm text-center mt-3 italic">{images[lightboxIndex].caption}</p>
            )}
            <p className="text-white/40 text-xs text-center mt-1">{lightboxIndex + 1} / {images.length} · Press Esc or click outside to close</p>
          </div>
          {lightboxIndex < images.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors">›</button>
          )}
        </div>
      )}

      {/* Revision history */}
      {showRevisions && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-lg font-semibold">Edit History ({LANGUAGES.find(l => l.value === currentLang)?.label})</h3>
              <button onClick={() => setShowRevisions(false)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
            </div>
            {revisions.length === 0 ? (
              <p className="text-gray-400 text-sm">No edit history yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {revisions.map(rev => (
                  <div key={rev.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{(rev as any).profiles?.username ?? 'Unknown'}</span>
                      <span className="text-gray-400 text-xs">{formatDate(rev.edited_at ?? rev.created_at)}</span>
                    </div>
                    <p className="text-gray-500 mt-1 line-clamp-2">{rev.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}