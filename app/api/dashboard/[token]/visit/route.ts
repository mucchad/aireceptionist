// POST /api/dashboard/[token]/visit
// Called once on dashboard mount to log a visit — NOT called on every 15s poll

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logVisit } from '@/lib/db/visits'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key)
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Resolve account from token
    const supabase = getSupabase()
    const { data: accounts } = await supabase.from('accounts').select('id,dashboard_token')
    const account = (accounts ?? []).find((a) => a.dashboard_token === token)
    if (!account) return NextResponse.json({ ok: false }, { status: 404 })

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null
    const userAgent = request.headers.get('user-agent') ?? null

    await logVisit(account.id, ip, userAgent)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Visit log error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
