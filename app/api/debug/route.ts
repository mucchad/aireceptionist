import { NextResponse } from 'next/server'
import { getAccounts } from '@/lib/db/accounts'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const accounts = await getAccounts()
    return NextResponse.json({ source: 'getAccounts', count: accounts.length, names: accounts.map(a => a.name) })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
