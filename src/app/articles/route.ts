import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const getArticle = unstable_cache(
  async (slug: string) => {
    const { data } = await supabase
      .from('articles')
      .select(`
        id, slug, category, article_type, status, featured, thumbnail_url,
        view_count, created_at, updated_at, author_id, source_url,
        profiles(id, username, avatar_url, role),
        article_translations(id, article_id, language, title, excerpt, content),
        images(id, url, caption)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()
    return data
  },
  ['article-slug'],
  { revalidate: 3600, tags: ['article'] }
)

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const article = await getArticle(params.slug)
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(article, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
  })
}