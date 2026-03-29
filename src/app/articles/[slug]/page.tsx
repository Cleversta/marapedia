'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCategoryInfo, formatDate, timeAgo, getArticleTypeLabel } from '@/lib/utils'
import type { Category } from '@/types'

interface Translation {
  id: string
  language: string
  title: string | null
  content: string | null
  excerpt: string | null
}

interface ArticleImage {
  url: string
  caption: string | null
}

interface Article {
  id: string
  slug: string
  category: Category
  article_type?: string | null
  status: string
  thumbnail_url: string | null
  images?: ArticleImage[]
  view_count: number
  created_at: string
  updated_at: string
  author_id: string
  profiles?: { username: string; avatar_url: string | null }
  article_translations?: Translation[]
}

const LANG_LABELS: Record<string, string> = {
  mara: 'Mara',
  english: 'English',
  myanmar: 'မြန်မာ',
  mizo: 'Mizo',
  en: 'English',
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentLang, setCurrentLang] = useState('mara')
  const [user, setUser] = useState<any>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  useEffect(() => {
    if (!slug) return
    fetchArticle()
  }, [slug])

  useEffect(() => {
    if (lightboxIndex === null) return
    const total = allImagesForLightbox().length
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? Math.min(i + 1, total - 1) : null)
      if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, article])

  function allImagesForLightbox(): ArticleImage[] {
    if (!article) return []
    return [
      ...(article.thumbnail_url ? [{ url: article.thumbnail_url, caption: null }] : []),
      ...(article.images ?? []).slice(1),
    ]
  }

  async function fetchArticle() {
    setLoading(true)
    const { data, error } = await supabase
      .from('articles')
      .select('*, profiles(username, avatar_url), article_translations(*), images(*)')
      .eq('slug', slug)
      .single()

    if (error || !data) { setLoading(false); return }

    setArticle(data)
    const langs = data.article_translations?.map((t: Translation) => t.language) ?? []
    if (langs.includes('mara')) setCurrentLang('mara')
    else if (langs.includes('english')) setCurrentLang('english')
    else if (langs.includes('en')) setCurrentLang('en')
    else if (langs.length > 0) setCurrentLang(langs[0])

    await supabase.from('articles').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', data.id)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-stone-200 border-t-green-600 animate-spin" />
        <p className="text-xs text-stone-400 tracking-widest uppercase">Loading</p>
      </div>
    </div>
  )

  if (!article) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-stone-100 flex items-center justify-center text-xl">📄</div>
        <h2 className="text-base font-semibold text-stone-800 mb-1">Article not found</h2>
        <p className="text-sm text-stone-400 mb-5">This article may have been removed.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          ← Marapedia
        </Link>
      </div>
    </div>
  )

  const cat = getCategoryInfo(article.category)
  const translations = article.article_translations ?? []
  const availableLangs = translations.map(t => t.language)
  const translation = translations.find(t => t.language === currentLang) ?? translations[0]
  const isOwner = user?.id === article.author_id
  const allImages = allImagesForLightbox()
  const typeLabel = getArticleTypeLabel(article.category, article.article_type)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        .article-page { font-family: 'DM Sans', sans-serif; }
        .article-title { font-family: 'Lora', Georgia, serif; }

        .article-body { font-family: 'Lora', Georgia, serif; }
        .article-body p { margin-bottom: 1.5em; line-height: 1.85; color: #292524; font-size: 1.0625rem; }
        .article-body h1, .article-body h2, .article-body h3 { font-family: 'Lora', serif; font-weight: 700; color: #111; margin: 2em 0 0.65em; line-height: 1.3; }
        .article-body h1 { font-size: 1.6rem; }
        .article-body h2 { font-size: 1.25rem; border-bottom: 1px solid #e7e5e4; padding-bottom: 0.4em; }
        .article-body h3 { font-size: 1.08rem; }
        .article-body ul, .article-body ol { padding-left: 1.5rem; margin-bottom: 1.5em; }
        .article-body li { margin-bottom: 0.4em; line-height: 1.75; color: #292524; font-size: 1.0625rem; }
        .article-body blockquote { border-left: 3px solid #16a34a; padding: 0.75rem 1.25rem; margin: 1.75em 0; background: #f0fdf4; border-radius: 0 8px 8px 0; color: #166534; font-style: italic; }
        .article-body a { color: #15803d; text-decoration: underline; text-underline-offset: 3px; }
        .article-body img { border-radius: 10px; max-width: 100%; margin: 1em auto; display: block; }
        .article-body strong { font-weight: 600; color: #111; }

        .img-thumb { cursor: zoom-in; overflow: hidden; background: #e7e5e4; position: relative; }
        .img-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .img-thumb:hover img { transform: scale(1.07); }

        .lightbox-fade { animation: lbFade 0.18s ease; }
        .lightbox-pop { animation: lbPop 0.22s cubic-bezier(0.34, 1.4, 0.64, 1); }
        @keyframes lbFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lbPop { from { opacity: 0; transform: scale(0.91) } to { opacity: 1; transform: scale(1) } }

        .lang-pill { position: relative; }
        .lang-pill.active::after { content: ''; position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%); width: 18px; height: 2px; background: #15803d; border-radius: 2px; }

        .img-strip::-webkit-scrollbar { display: none; }
        .img-strip { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="article-page min-h-screen bg-stone-50">

        {/* ── Lightbox ─────────────────────────────────────────────────────── */}
        {lightboxIndex !== null && allImages.length > 0 && (
          <div
            className="lightbox-fade fixed inset-0 z-50 bg-black/92 flex flex-col items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-5">
              <span className="text-white/35 text-sm tabular-nums">{lightboxIndex + 1} / {allImages.length}</span>
              <button
                onClick={() => setLightboxIndex(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {lightboxIndex > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i - 1 : null) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {lightboxIndex < allImages.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i + 1 : null) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <div className="lightbox-pop max-w-4xl w-full px-14" onClick={e => e.stopPropagation()}>
              <img
                src={allImages[lightboxIndex].url}
                alt={allImages[lightboxIndex].caption ?? ''}
                className="max-h-[80vh] w-full object-contain rounded-xl shadow-2xl"
              />
              {allImages[lightboxIndex].caption && (
                <p className="text-center text-sm text-white/45 mt-3 font-light">{allImages[lightboxIndex].caption}</p>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="absolute bottom-5 flex items-center gap-1.5">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setLightboxIndex(i) }}
                    className={`rounded-full transition-all ${i === lightboxIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Sticky nav ───────────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-40 bg-stone-50/80 backdrop-blur-lg border-b border-stone-200/60">
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-3" style={{ height: '50px' }}>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cat.color}`}>
                {cat.icon} {cat.label}
              </span>
              {article.status !== 'published' && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">Draft</span>
              )}
              {isOwner && (
                <Link
                  href={`/articles/edit/${article.slug}`}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-stone-200 text-stone-500 rounded-lg hover:border-green-300 hover:text-green-700 transition-all font-medium"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
              )}
            </div>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-8 pb-20">

          {/* ── Article header ───────────────────────────────────────────── */}
          <header className="mb-8">

            {/* 1. Byline */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-800 overflow-hidden ring-1 ring-stone-200 shrink-0">
                {article.profiles?.avatar_url
                  ? <img src={article.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (article.profiles?.username?.[0]?.toUpperCase() ?? 'A')
                }
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-stone-400">
                <span className="font-medium text-stone-600">{article.profiles?.username ?? 'Anonymous'}</span>
                <span className="text-stone-300">·</span>
                <span>{formatDate(article.updated_at ?? article.created_at)}</span>
                <span className="text-stone-300">·</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {(article.view_count ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* 2. Title */}
            <h1 className="article-title text-[1.8rem] md:text-[2.1rem] font-bold text-stone-900 leading-[1.2] mb-3 tracking-[-0.01em]">
              {translation?.title ?? article.slug}
            </h1>

            {/* 3. Article type badge */}
            {typeLabel && (
              <div className="mb-4">
                <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 font-medium border border-stone-200">
                  {typeLabel}
                </span>
              </div>
            )}

            {/* 4. Horizontal image strip */}
            {allImages.length > 0 && (
              <div className="img-strip flex gap-2 overflow-x-auto pb-1 mb-5">
                {allImages.map((img, i) => (
                  <div
                    key={i}
                    className="img-thumb shrink-0 shadow-sm"
                    style={{ width: '88px', height: '64px', borderRadius: '7px' }}
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img src={img.url} alt={img.caption ?? `Photo ${i + 1}`} />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 text-[8px] bg-black/50 text-white/90 px-1.5 py-0.5 rounded-full leading-tight">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="border-b border-stone-200" />
          </header>

          {/* ── Language switcher ────────────────────────────────────────── */}
          {availableLangs.length > 1 && (
            <div className="flex items-center gap-0 mb-7 border-b border-stone-200">
              {availableLangs.map(lang => (
                <button
                  key={lang}
                  onClick={() => setCurrentLang(lang)}
                  className={`lang-pill px-4 py-2.5 text-sm font-medium transition-colors ${
                    currentLang === lang
                      ? 'active text-green-700'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  {LANG_LABELS[lang] ?? lang}
                </button>
              ))}
            </div>
          )}

          {/* ── Body content ─────────────────────────────────────────────── */}
          {translation?.content ? (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: translation.content }}
            />
          ) : (
            <div className="py-14 text-center border border-dashed border-stone-200 rounded-2xl">
              <p className="text-stone-300 italic text-sm">No content in this language yet.</p>
              {availableLangs.length > 1 && (
                <p className="text-stone-400 text-xs mt-2">Switch language above to read.</p>
              )}
            </div>
          )}

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <footer className="mt-14 pt-5 border-t border-stone-200 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-stone-400 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Updated {timeAgo(article.updated_at ?? article.created_at)}
            </p>
            <Link href="/" className="text-xs text-green-700 hover:text-green-800 font-medium transition-colors">
              ← Marapedia
            </Link>
          </footer>

        </main>
      </div>
    </>
  )
}