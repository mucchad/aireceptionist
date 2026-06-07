// API route: POST /api/accounts/[id]/restore
// Clears deleted_at to bring a soft-deleted account back to the active list

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase()

    const { error } = await supabase
      .from('accounts')
      .update({ deleted_at: null })
      .eq('id', params.id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to restore account:', error)
    return NextResponse.json({ error: 'Failed to restore account' }, { status: 500 })
  }
}
