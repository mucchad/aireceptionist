// API route: GET /api/dashboard/[token]
// Looks up an account by its secret dashboard token and returns its leads + stats
// force-dynamic disables Next.js response caching so leads always reflect live DB data

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLeads, getLeadCounts } from '@/lib/db/leads'
import { getConversationCount } from '@/lib/db/conversations'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key)
}

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Look up the account by its secret dashboard token
    // Note: we select * and filter in JS — Supabase PostgREST schema cache
    // can lag after ALTER TABLE, causing newly-added columns to return null
    const supabase = getSupabase()
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')

    const account = (accounts ?? []).find((a) => a.dashboard_token === token)

    if (error || !account) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Fetch leads, counts, and conversation stats in parallel
    const [leads, counts, conversations] = await Promise.all([
      getLeads(account.id),
      getLeadCounts(account.id),
      getConversationCount(account.id),
    ])

    return NextResponse.json({
      accountName: account.name,
      logoUrl: account.logo_url ?? null,
      leads,
      counts,
      conversations,
    })
  } catch (error) {
    console.error('Dashboard load error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
