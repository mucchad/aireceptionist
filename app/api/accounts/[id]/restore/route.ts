// API route: POST /api/accounts/[id]/restore
// Clears deleted_at to bring a soft-deleted account back to the active list
//
// Uses a direct fetch to the Supabase REST API instead of supabase-js because
// supabase-js may strip null values from PATCH payloads, making { deleted_at: null }
// a silent no-op. Direct fetch with JSON.stringify guarantees null is sent.

import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { id } = params

  try {
    // PATCH directly — bypasses supabase-js serialization to guarantee null is sent
    const patchRes = await fetch(
      `${url}/rest/v1/accounts?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ deleted_at: null }),
      }
    )

    if (!patchRes.ok) {
      const text = await patchRes.text()
      console.error(`[restore] PATCH failed: ${patchRes.status} ${text}`)
      throw new Error(`DB update failed: ${patchRes.status}`)
    }

    const rows = await patchRes.json() as Array<{ id: string; deleted_at: string | null }>
    const updated = rows[0]
    console.log(`[restore] account=${id} deleted_at after update=${updated?.deleted_at ?? 'null'}`)

    if (updated?.deleted_at) {
      console.error(`[restore] Update was a no-op — deleted_at still set`)
      return NextResponse.json({ error: 'Restore failed — deleted_at did not clear' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[restore] error:', error)
    return NextResponse.json({ error: 'Failed to restore account' }, { status: 500 })
  }
}
