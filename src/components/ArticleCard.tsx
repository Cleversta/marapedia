import Link from 'next/link'
import { getCategoryInfo, timeAgo, makeExcerpt, getPreferredTranslation } from '@/lib/utils'
import type { Article } from '@/types'

interface Props {
  article: Article
}

export default function ArticleCard({ article }: Props) {
  const cat = getCategoryInfo(article.category)
  const translation = getPreferredTranslation(article.article_translations)

  if (!translation) return null

  return (
    <Link href={`/articles/${article.slug}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden
        hover:border-green-300 hover:shadow-md hover:shadow-green-50
        transition-all duration-200 h-full flex flex-col">

        {/* Thumbnail */}
        {article.thumbnail_url ? (
          <div className="h-44 overflow-hidden flex-shrink-0 bg-gray-100">
            <img
              src={article.thumbnail_url}
              alt={translation.title ?? ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          /* No image — subtle pattern placeholder */
          <div className="h-20 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100
            flex items-center justify-center text-3xl opacity-40 select-none">
            {cat.icon}
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-2">

          {/* Category badge */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${cat.color}`}>
              {cat.icon} {cat.label}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display font-semibold text-[0.9375rem] leading-snug
            text-gray-900 group-hover:text-green-800 transition-colors line-clamp-2">
            {translation.title}
          </h3>

          {/* Excerpt */}
          {(translation.excerpt || translation.content) && (
            <p className="text-[0.8125rem] text-gray-500 line-clamp-2 leading-relaxed flex-1">
              {translation.excerpt || makeExcerpt(translation.content ?? '')}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1
            border-t border-gray-100 mt-auto">
            <span className="flex items-center gap-1.5">
              {/* Avatar initial */}
              <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 text-[9px]
                font-bold flex items-center justify-center flex-shrink-0">
                {(article.profiles?.username ?? 'A')[0].toUpperCase()}
              </span>
              <span className="truncate max-w-[80px]">
                {article.profiles?.username ?? 'Anonymous'}
              </span>
            </span>
            <div className="flex items-center gap-2.5">
              {(article.view_count ?? 0) > 0 && (
                <span className="flex items-center gap-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {article.view_count}
                </span>
              )}
              <span>{timeAgo(article.updated_at ?? article.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}