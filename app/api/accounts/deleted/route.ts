// API route: GET /api/accounts/deleted
// Returns all soft-deleted accounts for the admin "Deleted" view

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getDeletedAccounts } from '@/lib/db/accounts'

export async function GET() {
  try {
    const accounts = await getDeletedAccounts()
    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Failed to fetch deleted accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch deleted accounts' }, { status: 500 })
  }
}
