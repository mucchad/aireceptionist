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
  // Join visits with accounts to get the account name
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/dashboard_visits?select=id,account_id,visited_at,ip_address,user_agent,accounts(name)&order=visited_at.desc&limit=500`,
    { headers: headers(), cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`Failed to fetch visits: ${res.status}`)

  const rows: Array<{
    id: string
    account_id: string
    visited_at: string
    ip_address: string | null
    user_agent: string | null
    accounts: { name: string } | null
  }> = await res.json()

  return rows
    .map((r) => ({
      id: r.id,
      account_id: r.account_id,
      account_name: r.accounts?.name ?? 'Unknown',
      visited_at: r.visited_at,
      ip_address: r.ip_address,
      user_agent: r.user_agent,
    }))
    .sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime())
}
