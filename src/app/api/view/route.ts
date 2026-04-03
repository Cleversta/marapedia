// app/api/view/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ ok: false }, { status: 400 })

  // Fire and forget — don't await, respond instantly
  supabase.rpc('increment_view_count', { article_id: id, amount: 1 }).then()

  return NextResponse.json({ ok: true })
}