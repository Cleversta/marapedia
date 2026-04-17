import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

const getStats = unstable_cache(
  async () => {
    const [{ count: articles }, { count: users }, categoryRows] = await Promise.all([
      supabaseServer.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabaseServer.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseServer.from('articles').select('category').eq('status', 'published'),
    ])

    const categoryCounts: Record<string, number> = {}
    for (const row of categoryRows.data ?? []) {
      const cat = row.category as string
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
    }

    return {
      articles: articles ?? 0,
      users: users ?? 0,
      categoryCounts,
    }
  },
  ['stats'],
  { revalidate: 3600, tags: ['article'] }
)

export async function GET() {
  const data = await getStats()
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
  })
}