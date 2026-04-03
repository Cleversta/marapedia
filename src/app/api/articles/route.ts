//lib/api/articles/route.ts
import { unstable_cache } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

const FIELDS = `
  id, slug, category, article_type, status, featured, thumbnail_url,
  view_count, created_at, updated_at, author_id, source_url,
  profiles(id, username, avatar_url, role, created_at),
  article_translations(id, article_id, language, title, excerpt, content),
  images(id, url, caption)
`

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')
  const category = req.nextUrl.searchParams.get('category')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '10')

  const cacheKey = `articles-${type}-${category}-${limit}`

  const fetchData = unstable_cache(
    async () => {
      let query = supabaseServer
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