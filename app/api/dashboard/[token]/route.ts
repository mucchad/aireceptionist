// API route: GET /api/dashboard/[token]
// Looks up an account by its secret dashboard token and returns its leads + stats
// force-dynamic disables Next.js response caching so leads always reflect live DB data

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLeads } from '@/lib/db/leads'

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

    // Fetch leads — derive all counts from this single source of truth
    const leads = await getLeads(account.id)

    // Fetch conversation counts with explicit columns to avoid schema cache issues
    const supabaseClient = getSupabase()
    const { data: convRows } = await supabaseClient
      .from('conversations')
      .select('id, account_id, channel')

    const convs = (convRows ?? []).filter((c) => c.account_id === account.id)

    // Compute all counts from the leads array — never trust a separate query
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    const counts = {
      total:     leads.length,
      today:     leads.filter((l) => new Date(l.created_at) >= todayStart).length,
      thisWeek:  leads.filter((l) => new Date(l.created_at) >= weekStart).length,
      byStatus: {
        new:       leads.filter((l) => l.status === 'new').length,
        contacted: leads.filter((l) => l.status === 'contacted').length,
        resolved:  leads.filter((l) => l.status === 'resolved').length,
      },
    }

    const conversations = {
      total: convs.length,
      calls: convs.filter((c) => c.channel === 'call').length,
      sms:   convs.filter((c) => c.channel === 'sms').length,
    }

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
