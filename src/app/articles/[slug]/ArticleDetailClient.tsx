'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCategoryInfo, formatDate, timeAgo, getArticleTypeLabel } from '@/lib/utils'
import SongViewer from '@/components/SongViewer'
import PoemViewer from '@/components/PoemViewer'
import ShareButtons from '@/components/ShareButton'
import FavoriteButton from '@/components/FavoriteButton'   // ← NEW
import type { Article } from '@/types'
import CommentsSection from '@/components/CommentsSection'

// ─── (ARTICLE_STYLES unchanged — paste your original const here) ─────────────
const ARTICLE_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

.article-page { font-family: 'DM Sans', sans-serif; }
.article-title { font-family: 'Lora', Georgia, serif; }

.article-body {
  font-family: 'Lora', Georgia, serif;
  color: #1c1917;
  font-size: 1.0625rem;
  line-height: 1.9;
  letter-spacing: 0.01em;
}
.article-body > p:first-of-type::first-letter {
  float: left;
  font-size: 3.6em;
  line-height: 0.78;
  font-weight: 700;
  margin-right: 0.08em;
  margin-top: 0.06em;
  color: #15803d;
  font-family: 'Lora', Georgia, serif;
}
.article-body p { margin-bottom: 1.65em; color: #1c1917; }
.article-body > p:first-of-type { font-size: 1.125rem; color: #292524; }
.article-body h1, .article-body h2, .article-body h3, .article-body h4 {
  font-family: 'Lora', serif;
  color: #0c0a09;
  margin: 2.4em 0 0.7em;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.article-body h1 { font-size: 1.7rem; }
.article-body h2 { font-size: 1.3rem; padding-bottom: 0.45em; border-bottom: 1px solid #e7e5e4; }
.article-body h3 { font-size: 1.1rem; }
.article-body h4 { font-size: 1rem; font-style: italic; font-weight: 600; }
.article-body ul, .article-body ol { padding-left: 1.6rem; margin-bottom: 1.65em; }
.article-body ul { list-style-type: none; }
.article-body ul li { position: relative; padding-left: 0.2rem; }
.article-body ul li::before { content: '\u2013'; position: absolute; left: -1.1rem; color: #86efac; font-weight: 600; }
.article-body ol { list-style-type: decimal; }
.article-body li { margin-bottom: 0.55em; line-height: 1.75; color: #292524; font-size: 1.0375rem; }
.article-body blockquote {
  position: relative;
  border-left: none;
  padding: 1.25rem 1.5rem 1.25rem 2rem;
  margin: 2.2em 0;
  background: #f0fdf4;
  border-radius: 12px;
  color: #166534;
  font-style: italic;
  font-size: 1.075rem;
  line-height: 1.8;
}
.article-body blockquote::before {
  content: '\u201C';
  position: absolute;
  top: -0.1rem;
  left: 0.75rem;
  font-size: 3rem;
  color: #86efac;
  font-family: 'Lora', Georgia, serif;
  line-height: 1;
}
.article-body blockquote p { margin-bottom: 0; color: inherit; }
.article-body blockquote cite { display: block; margin-top: 0.75em; font-size: 0.85rem; font-style: normal; color: #15803d; font-weight: 500; }
.article-body blockquote cite::before { content: '\u2014 '; }
.article-body a { color: #15803d; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; transition: color 0.15s; }
.article-body a:hover { color: #166534; }
.article-body img { border-radius: 12px; max-width: 100%; margin: 2em auto; display: block; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.article-body figure { margin: 2em 0; }
.article-body figcaption { text-align: center; font-size: 0.8125rem; color: #a8a29e; font-style: italic; margin-top: 0.6em; font-family: 'DM Sans', sans-serif; }
.article-body strong { font-weight: 700; color: #0c0a09; }
.article-body em { font-style: italic; color: #292524; }
.article-body hr { border: none; text-align: center; margin: 2.5em 0; color: #a8a29e; font-size: 1.2rem; letter-spacing: 0.5em; }
.article-body hr::after { content: '\x00B7 \x00B7 \x00B7'; }
.article-body code { font-family: 'Courier New', monospace; font-size: 0.875em; background: #f5f5f4; padding: 0.15em 0.4em; border-radius: 4px; color: #292524; }
.article-body pre { background: #1c1917; color: #e7e5e4; padding: 1.25rem 1.5rem; border-radius: 10px; overflow-x: auto; margin: 1.75em 0; font-size: 0.875rem; line-height: 1.7; }
.article-body pre code { background: none; color: inherit; padding: 0; }
.article-body table { width: 100%; border-collapse: collapse; margin: 1.75em 0; font-size: 0.9375rem; font-family: 'DM Sans', sans-serif; }
.article-body th { text-align: left; padding: 0.6em 1em; background: #f5f5f4; font-weight: 600; color: #292524; border-bottom: 2px solid #e7e5e4; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.04em; }
.article-body td { padding: 0.65em 1em; border-bottom: 1px solid #f5f5f4; color: #44403c; vertical-align: top; }
.article-body tr:last-child td { border-bottom: none; }
.article-body tr:hover td { background: #fafaf9; }
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
`

const LANG_LABELS: Record<string, string> = {
  mara: 'Mara',
  english: 'English',
  myanmar: '\u1019\u103C\u1014\u103A\u1019\u102C',
  mizo: 'Mizo',
}

export default function ArticleDetailClient({ article }: { article: Article }) {
  const router = useRouter()
  const [currentLang, setCurrentLang] = useState('mara')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const prof = article.profiles

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      }
    })
  }, [])

  useEffect(() => {
    const langs = article.article_translations?.map(t => t.language) ?? []
    if (langs.includes('mara')) setCurrentLang('mara')
    else if (langs.includes('english')) setCurrentLang('english')
    else if (langs.length > 0) setCurrentLang(langs[0])

    fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: article.id, view_count: article.view_count ?? 0 }),
    }).catch(() => {})
  }, [article.id])

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

  function allImagesForLightbox() {
    return [
      ...(article.thumbnail_url ? [{ url: article.thumbnail_url, caption: null }] : []),
      ...(article.images ?? []).slice(1),
    ]
  }

  const cat = getCategoryInfo(article.category)
  const translations = article.article_translations ?? []
  const availableLangs = translations.map(t => t.language)
  const translation = translations.find(t => t.language === currentLang) ?? translations[0]
  const isOwner = user?.id === article.author_id
  const isAdmin = profile?.role === 'admin'
  const canEdit = isOwner || isAdmin
  const allImages = allImagesForLightbox()
  const typeLabel = getArticleTypeLabel(article.category, article.article_type)

  const sourceUrlDisplay = article.source_url
    ? article.source_url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 40)
    : null

  function renderContent() {
    if (!translation?.content) {
      return (
        <div className="py-14 text-center border border-dashed border-stone-200 rounded-2xl">
          <p className="text-stone-300 italic text-sm">No content in this language yet.</p>
          {availableLangs.length > 1 && (
            <p className="text-stone-400 text-xs mt-2">Switch language above to read.</p>
          )}
        </div>
      )
    }
    if (article.category === 'songs') return <SongViewer content={translation.content} title={translation.title ?? ''} />
    if (article.category === 'poems') return <PoemViewer content={translation.content} />
    return <div className="article-body" dangerouslySetInnerHTML={{ __html: translation.content }} />
  }

  return (
    <>
      <style>{ARTICLE_STYLES}</style>

      <div className="article-page min-h-screen bg-stone-50">

        {/* Lightbox */}
        {lightboxIndex !== null && allImages.length > 0 && (
          <div
            className="lightbox-fade fixed inset-0 z-50 bg-black/92 flex flex-col items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-5">
              <span className="text-white/35 text-sm tabular-nums">{lightboxIndex + 1} / {allImages.length}</span>
              <button onClick={() => setLightboxIndex(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {lightboxIndex > 0 && (
              <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i - 1 : null) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {lightboxIndex < allImages.length - 1 && (
              <button onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i + 1 : null) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <div className="lightbox-pop max-w-4xl w-full px-14" onClick={e => e.stopPropagation()}>
              <img src={allImages[lightboxIndex].url} alt={allImages[lightboxIndex].caption ?? ''}
                className="max-h-[80vh] w-full object-contain rounded-xl shadow-2xl" />
              {allImages[lightboxIndex].caption && (
                <p className="text-center text-sm text-white/45 mt-3 font-light">{allImages[lightboxIndex].caption}</p>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="absolute bottom-5 flex items-center gap-1.5">
                {allImages.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setLightboxIndex(i) }}
                    className={`rounded-full transition-all ${i === lightboxIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'}`} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sticky nav */}
        <nav className="sticky top-0 z-40 bg-stone-50/80 backdrop-blur-lg border-b border-stone-200/60">
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-3" style={{ height: '50px' }}>
            <button onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors group">
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
              {isAdmin && !isOwner && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 font-medium">
                  Admin
                </span>
              )}
              <FavoriteButton articleId={article.id} variant="button" />

              {canEdit && (
                <Link href={`/articles/edit/${article.slug}`}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-stone-200 text-stone-500 rounded-lg hover:border-green-300 hover:text-green-700 transition-all font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
              )}
            </div>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-10 pb-24">
          <header className="mb-10">

            {/* Author byline */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-800 overflow-hidden ring-1 ring-stone-200 shrink-0">
                {prof?.avatar_url
                  ? <img src={prof.avatar_url} alt="" className="w-full h-full object-cover" />
                  : prof?.username?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-stone-400">
                <span className="font-medium text-stone-600">
                  {prof?.username ?? 'Anonymous'}
                </span>
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

            <h1 className="article-title text-[2rem] md:text-[2.4rem] font-bold text-stone-900 leading-[1.18] mb-4 tracking-[-0.02em]">
              {translation?.title ?? article.slug}
            </h1>

            {(typeLabel || article.source_url) && (
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {typeLabel && (
                  <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 font-medium border border-stone-200">
                    {typeLabel}
                  </span>
                )}
                {article.source_url && (
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors font-medium max-w-[220px]"
                    title={article.source_url}>
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="truncate">{sourceUrlDisplay}</span>
                    <svg className="w-2.5 h-2.5 flex-shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {allImages.length > 0 && (
              <div className="img-strip flex gap-2 overflow-x-auto pb-1 mb-6">
                {allImages.map((img, i) => (
                  <div key={i} className="img-thumb shrink-0 shadow-sm"
                    style={{ width: '96px', height: '68px', borderRadius: '8px' }}
                    onClick={() => setLightboxIndex(i)}>
                    <img src={img.url} alt={img.caption ?? `Photo ${i + 1}`} />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 text-[8px] bg-black/50 text-white/90 px-1.5 py-0.5 rounded-full leading-tight">Cover</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="border-b border-stone-200" />
          </header>

          {availableLangs.length > 1 && (
            <div className="flex items-center gap-0 mb-8 border-b border-stone-200">
              {availableLangs.map(lang => (
                <button key={lang} onClick={() => setCurrentLang(lang)}
                  className={`lang-pill px-4 py-2.5 text-sm font-medium transition-colors ${
                    currentLang === lang ? 'active text-green-700' : 'text-stone-400 hover:text-stone-700'
                  }`}>
                  {LANG_LABELS[lang] ?? lang}
                </button>
              ))}
            </div>
          )}

          {renderContent()}
<footer className="mt-16 pt-6 border-t border-stone-200 space-y-4">
  {/* ── Share row ── */}
  <ShareButtons
    url={`https://marapedia.org/articles/${article.slug}`}
    title={translation?.title ?? article.slug}
  />
 
  {/* ── Likes & Comments ── */}
  <CommentsSection articleId={article.id} />   {/* ← ADD THIS LINE */}
 
  <div className="flex items-center justify-between flex-wrap gap-3">
    <p className="text-xs text-stone-400 flex items-center gap-1.5">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Updated {timeAgo(article.updated_at ?? article.created_at)}
    </p>
    <Link href="/" className="text-xs text-green-700 hover:text-green-800 font-medium transition-colors">
      ← Marapedia
    </Link>
  </div>
</footer>
        </main>
      </div>
    </>
  )
}