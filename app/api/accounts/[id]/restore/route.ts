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

    // Verify the update actually took — PostgREST silently ignores writes to
    // columns it doesn't know about when the schema cache is stale
    const { data: check } = await supabase
      .from('accounts')
      .select('id, deleted_at')
      .eq('id', params.id)
      .single()

    console.log(`[restore] account=${params.id} deleted_at after update=${check?.deleted_at ?? 'null'}`)

    if (check?.deleted_at) {
      // Update was a no-op — schema cache is stale. Surface a clear error.
      return NextResponse.json(
        { error: 'Schema cache issue: reload PostgREST schema in Supabase dashboard (Settings → API → Reload schema cache)' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to restore account:', error)
    return NextResponse.json({ error: 'Failed to restore account' }, { status: 500 })
  }
}
