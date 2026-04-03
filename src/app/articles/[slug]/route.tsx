// app/api/articles/route.ts
import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const FIELDS = `
  id, slug, category, article_type, status, featured, thumbnail_url,
  view_count, created_at, updated_at, author_id, source_url,
  profiles(id, username, avatar_url, role, created_at),
  article_translations(id, article_id, language, title, excerpt, content),
  images(id, url, caption)
`

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') ?? '10')

  // Each unique combo gets its own cache entry
  const cacheKey = `articles-${type}-${category}-${limit}`

  const fetchData = unstable_cache(
    async () => {
      let query = supabase
        .from('articles')
        .select(FIELDS)
        .eq('status', 'published')
        .limit(limit)

      if (type === 'recent')   query = query.order('updated_at', { ascending: false })
      if (type === 'viewed')   query = query.order('view_count', { ascending: false })
      if (type === 'featured') query = query.eq('featured', true).order('updated_at', { ascending: false })
      if (category)            query = query.eq('category', category).order('updated_at', { ascending: false })

      const { data } = await query
      return data ?? []
    },
    [cacheKey],
    { revalidate: 600, tags: ['article'] }
  )

  const data = await fetchData()

  return NextResponse.json(
    type === 'featured' ? data.slice(0, 1) : data,
    { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } }
  )
}