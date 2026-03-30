import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ArticleDetailClient from './ArticleDetailClient'
import type { Article } from '@/types'

export const revalidate = 3600

interface Props {
  params: { slug: string }
}

const getArticle = unstable_cache(
  async (slug: string) => {
    const { data } = await supabase
      .from('articles')
      .select(`
        id, slug, category, article_type, status,
        thumbnail_url, view_count, created_at, updated_at, author_id,
        profiles(username, avatar_url),
        article_translations(id, language, title, content, excerpt),
        images(url, caption)
      `)
      .eq('slug', slug)
      .single()
    return data as unknown as Article | null
  },
  ['article-detail'],
  { revalidate: 3600, tags: ['article'] }
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getArticle(params.slug)
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

  return {
    title,
    description,
openGraph: {
  title,
  description,
  url: `https://marapedia.org/articles/${data.slug}`,
  type: 'article',
  publishedTime: data.created_at,
  modifiedTime: data.updated_at ?? undefined,   // ✅ null → undefined
  authors: [authorName],
  images: data.thumbnail_url
    ? [{ url: data.thumbnail_url, width: 1200, height: 630, alt: title }]
    : [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
},
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: data.thumbnail_url ? [data.thumbnail_url] : ['/og-image.png'],
    },
  }
}

export default async function ArticleDetailPage({ params }: Props) {
  const article = await getArticle(params.slug)
  if (!article) notFound()
  return <ArticleDetailClient article={article} />
}