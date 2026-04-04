import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json([])

  const query = q.toLowerCase()

  // ── 1. Search article_translations (title, content, excerpt) ─────────────
  const { data: translationMatches } = await supabaseServer
    .from('article_translations')
    .select('article_id, title')
    .or(`title.ilike.%${q}%,content.ilike.%${q}%,excerpt.ilike.%${q}%`)

  // ── 2. Search articles directly for singer / songwriter ──────────────────
  const { data: singerMatches } = await supabaseServer
    .from('articles')
    .select('id, singer, songwriter')
    .or(`singer.ilike.%${q}%,songwriter.ilike.%${q}%`)
    .eq('status', 'published')

  // ── 3. Score all matches ─────────────────────────────────────────────────
  const scored = new Map<string, number>()

  // Score translation matches
  for (const m of translationMatches ?? []) {
    const title = (m.title ?? '').toLowerCase()
    const current = scored.get(m.article_id) ?? 0
    let score = 0
    if (title.startsWith(query)) score = 3       // title starts with → top
    else if (title.includes(query)) score = 2    // title contains → second
    else score = 1                                // content/excerpt match → last
    if (score > current) scored.set(m.article_id, score)
  }

  // Score singer/songwriter matches — rank same as title match
  for (const m of singerMatches ?? []) {
    const singer = (m.singer ?? '').toLowerCase()
    const songwriter = (m.songwriter ?? '').toLowerCase()
    const current = scored.get(m.id) ?? 0
    let score = 0
    if (singer.startsWith(query) || songwriter.startsWith(query)) score = 3
    else if (singer.includes(query) || songwriter.includes(query)) score = 2
    if (score > current) scored.set(m.id, score)
  }

  if (scored.size === 0) return NextResponse.json([])

  const ids = Array.from(scored.keys())

  // ── 4. Fetch full articles ────────────────────────────────────────────────
  const { data, error } = await supabaseServer
    .from('articles')
    .select(`
      id, slug, category, article_type, status, featured, thumbnail_url,
      view_count, created_at, updated_at, author_id, source_url,
      singer, songwriter,
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
    headers: { 'Cache-Control': 'no-store' },
  })
}