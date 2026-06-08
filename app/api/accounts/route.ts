// API route: GET /api/accounts
// Returns all accounts for the admin list

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAccounts } from '@/lib/db/accounts'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const accounts = await getAccounts()

    // Fetch all conversations and count per account
    // Explicit columns avoid Supabase schema cache issues
    const supabase = getSupabase()
    const { data: convos } = await supabase
      .from('conversations')
      .select('id, account_id, channel')

    const convoCounts: Record<string, { total: number; calls: number; sms: number }> = {}
    for (const c of convos ?? []) {
      if (!convoCounts[c.account_id]) convoCounts[c.account_id] = { total: 0, calls: 0, sms: 0 }
      convoCounts[c.account_id].total++
      if (c.channel === 'call') convoCounts[c.account_id].calls++
      if (c.channel === 'sms')  convoCounts[c.account_id].sms++
    }

    // Fetch primary owner contact phone for each account
    const { data: contacts } = await supabase
      .from('contacts')
      .select('account_id, phone')
      .eq('is_primary', true)
      .eq('role', 'owner')

    // Map account_id → owner phone
    const ownerPhones: Record<string, string> = {}
    for (const contact of contacts ?? []) {
      if (contact.phone) ownerPhones[contact.account_id] = contact.phone
    }

    return NextResponse.json({ accounts, convoCounts, ownerPhones })
  } catch (error) {
    console.error('Failed to fetch accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}
