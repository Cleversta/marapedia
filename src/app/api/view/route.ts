import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { id, view_count } = await req.json()
    if (!id) return NextResponse.json({ error: 'No id' }, { status: 400 })
    await supabase
      .from('articles')
      .update({ view_count: (view_count ?? 0) + 1 })
      .eq('id', id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}