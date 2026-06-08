// Database functions for dashboard_visits telemetry

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function logVisit(accountId: string, ip: string | null, userAgent: string | null) {
  await fetch(`${SUPABASE_URL}/rest/v1/dashboard_visits`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ account_id: accountId, ip_address: ip, user_agent: userAgent }),
  })
}

export interface VisitRow {
  id: string
  account_id: string
  account_name: string
  visited_at: string
  ip_address: string | null
  user_agent: string | null
}

export async function getVisits(): Promise<VisitRow[]> {
  // Two separate fetches, joined in JS — avoids PostgREST embed/join syntax
  const [visitsRes, accountsRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/dashboard_visits?select=id,account_id,visited_at,ip_address,user_agent&limit=500`,
      { headers: headers(), cache: 'no-store' }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/accounts?select=id,name`,
      { headers: headers(), cache: 'no-store' }
    ),
  ])

  if (!visitsRes.ok) throw new Error(`Failed to fetch visits: ${visitsRes.status}`)
  if (!accountsRes.ok) throw new Error(`Failed to fetch accounts: ${accountsRes.status}`)

  const visits: Array<{
    id: string
    account_id: string
    visited_at: string
    ip_address: string | null
    user_agent: string | null
  }> = await visitsRes.json()

  const accounts: Array<{ id: string; name: string }> = await accountsRes.json()
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]))

  return visits
    .map((r) => ({
      id: r.id,
      account_id: r.account_id,
      account_name: accountMap.get(r.account_id) ?? 'Unknown',
      visited_at: r.visited_at,
      ip_address: r.ip_address,
      user_agent: r.user_agent,
    }))
    .sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime())
}
