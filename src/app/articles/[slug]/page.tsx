import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SITE_URL, SITE_NAME } from '@/lib/config'
import ArticleDetailClient from './ArticleDetailClient'
import type { Article } from '@/types'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

const getArticle = unstable_cache(
  async (slug: string) => {
    const { data } = await supabase
      .from('articles')
      .select(`
        id, slug, category, article_type, status,
        thumbnail_url, view_count, created_at, updated_at, author_id,
        source_url,
        images(url, caption),
        profiles!articles_author_id_fkey(username, avatar_url),
        article_translations(id, language, title, content, excerpt)
      `)
      .eq('slug', slug)
      .single()
    return data as unknown as Article | null
  },
  ['article-detail'],
  { revalidate: 3600, tags: ['article'] }
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const raw = await getArticle(slug)
  if (!raw) return { title: 'Article Not Found' }

  // ✅ Normalize profiles — always a plain object
  const prof = Array.isArray(raw.profiles) ? raw.profiles[0] ?? null : raw.profiles

  const translation =
    raw.article_translations?.find((t: any) => t.language === 'english') ??
    raw.article_translations?.find((t: any) => t.language === 'mara') ??
    raw.article_translations?.[0]

  const title = translation?.title ?? raw.slug
  const description =
    translation?.excerpt ??
    (translation?.content ?? '').replace(/<[^>]*>/g, '').substring(0, 160)

  const authorName = prof?.username ?? 'Marapedia'

  const image = raw.thumbnail_url
    ? { url: raw.thumbnail_url, width: 1200, height: 630, alt: title }
    : { url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: title }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/articles/${raw.slug}`,
      type: 'article',
      publishedTime: raw.created_at,
      modifiedTime: raw.updated_at ?? undefined,
      authors: [authorName],
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  }
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params
  const raw = await getArticle(slug)
  if (!raw) notFound()

  // ✅ Normalize profiles before passing to client — always a plain object
  const article: Article = {
    ...raw,
    profiles: Array.isArray(raw.profiles) ? raw.profiles[0] ?? null : raw.profiles,
  }

  const translation =
    article.article_translations?.find((t: any) => t.language === 'english') ??
    article.article_translations?.find((t: any) => t.language === 'mara') ??
    article.article_translations?.[0]

  const authorName = article.profiles?.username ?? 'Marapedia'

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: translation?.title ?? article.slug,
            description: translation?.excerpt ?? '',
            image: article.thumbnail_url ?? `${SITE_URL}/og-image.png`,
            author: {
              '@type': 'Person',
              name: authorName,
            },
            publisher: {
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
            },
            datePublished: article.created_at,
            dateModified: article.updated_at ?? article.created_at,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${SITE_URL}/articles/${article.slug}`,
            },
          }),
        }}
      />
      <ArticleDetailClient article={article} />
    </>
  )
}