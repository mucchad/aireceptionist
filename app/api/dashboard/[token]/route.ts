// API route: GET /api/dashboard/[token]
// Looks up an account by its secret dashboard token and returns its leads + stats
// force-dynamic disables Next.js response caching so leads always reflect live DB data

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLeads, getLeadCounts } from '@/lib/db/leads'

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
    const supabase = getSupabase()
    const { data: account, error } = await supabase
      .from('accounts')
      .select('id, name, status')
      .eq('dashboard_token', token)
      .single()

    if (error || !account) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // Fetch leads directly inline for debugging
    const supabase2 = getSupabase()
    const { data: leadsData, error: leadsError } = await supabase2
      .from('leads')
      .select('*')
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })

    console.log('DEBUG account.id:', account.id)
    console.log('DEBUG leadsError:', leadsError)
    console.log('DEBUG leadsData:', leadsData)

    const [leads, counts] = await Promise.all([
      getLeads(account.id),
      getLeadCounts(account.id),
    ])

    return NextResponse.json({
      accountName: account.name,
      leads,
      counts,
      _debug: { accountId: account.id, directLeads: leadsData, directError: leadsError },
    })
  } catch (error) {
    console.error('Dashboard load error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
