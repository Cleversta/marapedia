import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q) return NextResponse.json([])

  const { data } = await supabaseServer
    .from('articles')
    .select(`
      id, slug, category, article_type, status, featured, thumbnail_url,
      view_count, created_at, updated_at, author_id, source_url,
      profiles(id, username, avatar_url, role, created_at),
      article_translations(id, article_id, language, title, excerpt, content),
      images(id, url, caption)
    `)
    .eq('status', 'published')
    .or(`article_translations.title.ilike.%${q}%,article_translations.content.ilike.%${q}%`)
    .limit(20)

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'no-store' }
  })
}