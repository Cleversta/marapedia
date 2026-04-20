import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseServer } from "@/lib/supabase-server";

export async function DELETE(req: NextRequest) {
  try {
    // Get the target user ID from request body
    const { targetUserId } = await req.json()
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 })
    }

    // Verify the requester is authenticated using their JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    // Create a client scoped to the requester's JWT to verify identity
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requesterId = user.id

    // Check permission: must be deleting self OR be an admin
    if (requesterId !== targetUserId) {
      const { data: requesterProfile } = await supabaseServer
        .from('profiles')
        .select('role')
        .eq('id', requesterId)
        .single()

      if (requesterProfile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Delete the user from auth.users — cascade handles profiles,
    // set null handles articles/translations/revisions/images
    const { error: deleteError } = await supabaseServer.auth.admin.deleteUser(targetUserId)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}