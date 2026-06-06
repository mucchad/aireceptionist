// API route: PATCH /api/leads
// Updates the status of a lead

import { NextResponse } from 'next/server'
import { updateLeadStatus } from '@/lib/db/leads'
import type { LeadStatus } from '@/types'

const VALID_STATUSES: LeadStatus[] = ['new', 'contacted', 'resolved']

export async function PATCH(request: Request) {
  try {
    const { lead_id, status } = await request.json()

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await updateLeadStatus(lead_id, status)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update lead:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
