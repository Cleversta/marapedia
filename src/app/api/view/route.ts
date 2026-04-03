import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ ok: false }, { status: 400 })

  supabaseServer.rpc('increment_view_count', { article_id: id, amount: 1 }).then()

  return NextResponse.json({ ok: true })
}