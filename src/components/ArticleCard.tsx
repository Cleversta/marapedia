'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { getCategoryInfo, timeAgo, makeExcerpt, getPreferredTranslation } from '@/lib/utils'
import FavoriteButton from '@/components/FavoriteButton'
import type { Article } from '@/types'

interface Props {
  article: Article
}

function SharePopover({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('input')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const options = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.858L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.894 0-3.668-.523-5.186-1.43l-.372-.22-3.862.917.973-3.773-.242-.388A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>,
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    },
    {
      label: 'Messenger',
      href: `https://m.me/?link=${encodedUrl}`,
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.149 0 11.499c0 3.443 1.612 6.52 4.148 8.583V24l3.948-2.17c1.053.292 2.168.451 3.32.451 6.628 0 12-5.148 12-11.5C24 5.149 18.627 0 12 0zm1.191 15.494l-3.055-3.26-5.963 3.26L10.732 8.4l3.131 3.26L19.752 8.4l-6.561 7.094z"/></svg>,
    },
    {
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
    },
    {
      label: 'Twitter / X',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    },
  ]

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg shadow-black/8 p-1.5 w-40"
      style={{ animation: 'popIn 0.14s cubic-bezier(0.34,1.4,0.64,1)' }}
    >
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.93) translateY(3px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>

      {options.map(o => (
        <a
          key={o.label}
          href={o.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors font-medium"
        >
          {o.icon}
          {o.label}
        </a>
      ))}

      <div className="border-t border-gray-100 mt-1 pt-1">
        <button
          onClick={handleCopy}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors
            ${copied ? 'text-green-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          {copied
            ? <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Copied!</>
            : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>Copy link</>
          }
        </button>
      </div>
    </div>
  )
}

export default function ArticleCard({ article }: Props) {
  const [showShare, setShowShare] = useState(false)
  const [touched, setTouched] = useState(false)
  const cat = getCategoryInfo(article.category)
  const translation = getPreferredTranslation(article.article_translations)

  if (!translation) return null

  const articleUrl = `https://marapedia.org/articles/${article.slug}`

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="block group"
      onTouchStart={() => setTouched(true)}
    >
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden
        hover:border-green-300 hover:shadow-md hover:shadow-green-50
        transition-all duration-200 h-full flex flex-col">

        {/* Thumbnail */}
        {article.thumbnail_url ? (
          <div className="relative h-44 overflow-hidden flex-shrink-0 bg-gray-100">
            <img
              src={article.thumbnail_url}
              alt={translation.title ?? ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Favorite — top-right corner over image */}
            <div className="absolute top-2 right-2" onClick={e => e.preventDefault()}>
              <FavoriteButton
                articleId={article.id}
                variant="overlay"
                className={touched ? 'opacity-100' : ''}
              />
            </div>
          </div>
        ) : (
          <div className="relative h-20 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100
            flex items-center justify-center text-3xl opacity-40 select-none">
            {cat.icon}
            {/* Favorite — top-right corner, no-image fallback */}
            <div className="absolute top-2 right-2 opacity-100" onClick={e => e.preventDefault()}>
              <FavoriteButton articleId={article.id} variant="overlay" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-2">

          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${cat.color}`}>
              {cat.icon} {cat.label}
            </span>
          </div>

          <h3 className="font-display font-semibold text-[0.9375rem] leading-snug
            text-gray-900 group-hover:text-green-800 transition-colors line-clamp-2">
            {translation.title}
          </h3>

          {(translation.excerpt || translation.content) && (
            <p className="text-[0.8125rem] text-gray-500 line-clamp-2 leading-relaxed flex-1">
              {translation.excerpt || makeExcerpt(translation.content ?? '')}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1
            border-t border-gray-100 mt-auto">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 text-[9px]
                font-bold flex items-center justify-center flex-shrink-0">
                {(article.profiles?.username ?? 'A')[0].toUpperCase()}
              </span>
              <span className="truncate max-w-[80px]">
                {article.profiles?.username ?? 'Anonymous'}
              </span>
            </span>

            <div className="flex items-center gap-2">
              {(article.view_count ?? 0) > 0 && (
                <span className="flex items-center gap-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  {article.view_count}
                </span>
              )}
              <span>{timeAgo(article.updated_at ?? article.created_at)}</span>

              {/* ── Share button ── */}
              <div className="relative" onClick={e => e.preventDefault()}>
                {showShare && (
                  <SharePopover
                    url={articleUrl}
                    title={translation.title ?? article.slug}
                    onClose={() => setShowShare(false)}
                  />
                )}
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setShowShare(v => !v) }}
                  title="Share"
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all
                    ${showShare
                      ? 'text-green-600 bg-green-50 opacity-100'
                      : touched
                        ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-100'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
                    }`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}