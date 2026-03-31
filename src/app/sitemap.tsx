import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { SITE_URL } from '@/lib/config'

const CATEGORIES = [
  'history',
  'songs',
  'poems',
  'stories',
  'people',
  'places',
  'culture',
  'religion',
  'language',
  'other',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  const articleUrls = (articles ?? []).map(article => ({
    url: `${SITE_URL}/articles/${article.slug}`,
    lastModified: new Date(article.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const categoryUrls = CATEGORIES.map(cat => ({
    url: `${SITE_URL}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/photos`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    ...categoryUrls,
    ...articleUrls,
  ]
}