import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json([])

  const { data: matches } = await supabaseServer
    .from('article_translations')
    .select('article_id, title')
    .or(`title.ilike.%${q}%,content.ilike.%${q}%,excerpt.ilike.%${q}%`)

  if (!matches?.length) return NextResponse.json([])

  // Rank: title starts with query > title contains query > content match
  const scored = new Map<string, number>()
  for (const m of matches) {
    const title = (m.title ?? '').toLowerCase()
    const query = q.toLowerCase()
    const current = scored.get(m.article_id) ?? 0
    let score = 0
    if (title.startsWith(query)) score = 3       // "mara..." → top
    else if (title.includes(query)) score = 2    // "...mara..." → second
    else score = 1                                // content/excerpt match → last
    if (score > current) scored.set(m.article_id, score)
  }

  const ids = Array.from(scored.keys())

  const { data, error } = await supabaseServer
    .from('articles')
    .select(`
      id, slug, category, article_type, status, featured, thumbnail_url,
      view_count, created_at, updated_at, author_id, source_url,
      profiles(id, username, avatar_url, role, created_at),
      article_translations(id, article_id, language, title, excerpt, content),
      images(id, url, caption)
    `)
    .in('id', ids)
    .eq('status', 'published')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort by score descending
  const sorted = (data ?? []).sort((a, b) => {
    return (scored.get(b.id) ?? 0) - (scored.get(a.id) ?? 0)
  })

  return NextResponse.json(sorted, {
    headers: { 'Cache-Control': 'no-store' }
  })
}