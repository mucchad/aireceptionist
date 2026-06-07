// API route: GET /api/accounts
// Returns all accounts for the admin list

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAccounts } from '@/lib/db/accounts'

export async function GET() {
  try {
    const accounts = await getAccounts()
    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Failed to fetch accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}
