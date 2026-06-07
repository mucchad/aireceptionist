// API route: PATCH /api/accounts/[id]/delete
// Soft-deletes an account by setting deleted_at to now
//
// Uses direct fetch instead of supabase-js to avoid any null/value serialization issues

import { NextResponse } from 'next/server'

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { id } = params

  try {
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
        body: JSON.stringify({ deleted_at: new Date().toISOString() }),
      }
    )

    if (!patchRes.ok) {
      const text = await patchRes.text()
      console.error(`[delete] PATCH failed: ${patchRes.status} ${text}`)
      throw new Error(`DB update failed: ${patchRes.status}`)
    }

    const rows = await patchRes.json() as Array<{ id: string; deleted_at: string | null }>
    console.log(`[delete] account=${id} deleted_at=${rows[0]?.deleted_at ?? 'null'}`)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete account' },
      { status: 500 }
    )
  }
}
