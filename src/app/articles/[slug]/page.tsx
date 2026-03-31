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
        profiles(username, avatar_url),
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
  const data = await getArticle(slug)
  if (!data) return { title: 'Article Not Found' }

  const translation =
    data.article_translations?.find((t: any) => t.language === 'english') ??
    data.article_translations?.find((t: any) => t.language === 'mara') ??
    data.article_translations?.[0]

  const title = translation?.title ?? data.slug
  const description =
    translation?.excerpt ??
    (translation?.content ?? '').replace(/<[^>]*>/g, '').substring(0, 160)

  const authorName = Array.isArray(data.profiles)
    ? (data.profiles[0]?.username ?? 'Marapedia')
    : (data.profiles?.username ?? 'Marapedia')

  const image = data.thumbnail_url
    ? { url: data.thumbnail_url, width: 1200, height: 630, alt: title }
    : { url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: title }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/articles/${data.slug}`,
      type: 'article',
      publishedTime: data.created_at,
      modifiedTime: data.updated_at ?? undefined,
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
  const article = await getArticle(slug)
  if (!article) notFound()

  const translation =
    article.article_translations?.find((t: any) => t.language === 'english') ??
    article.article_translations?.find((t: any) => t.language === 'mara') ??
    article.article_translations?.[0]

  const authorName = Array.isArray(article.profiles)
    ? (article.profiles[0]?.username ?? 'Marapedia')
    : (article.profiles?.username ?? 'Marapedia')

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