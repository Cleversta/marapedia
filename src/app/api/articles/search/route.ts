import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json([])

  // Step 1: find matching translation IDs
  const { data: matches } = await supabaseServer
    .from('article_translations')
    .select('article_id')
    .or(`title.ilike.%${q}%,content.ilike.%${q}%,excerpt.ilike.%${q}%`)

  if (!matches?.length) return NextResponse.json([])

  const ids = Array.from(new Set(matches.map(m => m.article_id)))

  // Step 2: fetch full articles by those IDs
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

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'no-store' }
  })
}