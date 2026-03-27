import Link from 'next/link'
import { getCategoryInfo, timeAgo, makeExcerpt } from '@/lib/utils'
import type { Article } from '@/types'

interface Props {
  article: Article
  defaultLang?: string
}

export default function ArticleCard({ article, defaultLang = 'english' }: Props) {
  const cat = getCategoryInfo(article.category)
  const translation =
    article.article_translations?.find(t => t.language === defaultLang) ??
    article.article_translations?.[0]

  if (!translation) return null

  return (
    <Link href={`/articles/${article.slug}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-green-300 hover:shadow-sm transition-all">
        {article.thumbnail_url && (
          <div className="h-40 overflow-hidden">
            <img
              src={article.thumbnail_url}
              alt={translation.title ?? ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${cat.color}`}>
              {cat.icon} {cat.label}
            </span>
          </div>
          <h3 className="font-display font-semibold text-base mb-1 group-hover:text-green-800 transition-colors line-clamp-2">
            {translation.title}
          </h3>
          {translation.excerpt && (
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {translation.excerpt || makeExcerpt(translation.content ?? '')}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>{article.profiles?.username ?? 'Anonymous'}</span>
            <span>{timeAgo(article.updated_at ?? article.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}