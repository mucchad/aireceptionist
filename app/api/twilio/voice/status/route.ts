// API route: POST /api/twilio/voice/status
// Called by Twilio when a call ends (status callback registered in voice/route.ts)
// If the call ended without capturing a lead, saves a fallback lead so the
// business owner can still see the caller and follow up

import { NextResponse } from 'next/server'
import { getAccountByPhone } from '@/lib/twilio/client'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid = searchParams.get('callSid') as string
    const to      = searchParams.get('to')      as string
    const from    = searchParams.get('from')    as string

    const formData   = await request.formData()
    const callStatus = formData.get('CallStatus') as string

    console.log(`[voice/status] callSid=${callSid} status=${callStatus} from=${from}`)

    // Only act on completed calls
    if (callStatus !== 'completed') {
      return new NextResponse('ok', { status: 200 })
    }

    const account = await getAccountByPhone(to)
    if (!account) {
      console.log(`[voice/status] No account for ${to} — skipping`)
      return new NextResponse('ok', { status: 200 })
    }

    // Check if this call already has a lead — if so, nothing to do
    const supabase = getSupabase()
    const { data: convRows } = await supabase
      .from('conversations')
      .select('id, lead_id')
      .eq('customer_phone', callSid)  // voice conversations use callSid as the lookup key
      .eq('account_id', account.id)
      .eq('channel', 'call')

    const conversation = (convRows ?? [])[0] ?? null

    if (!conversation) {
      console.log(`[voice/status] No conversation found for callSid=${callSid} — skipping`)
      return new NextResponse('ok', { status: 200 })
    }

    if (conversation.lead_id) {
      console.log(`[voice/status] Lead already exists (${conversation.lead_id}) — skipping`)
      return new NextResponse('ok', { status: 200 })
    }

    // No lead was captured — save a fallback lead so the caller isn't lost
    console.log(`[voice/status] No lead for conversation ${conversation.id} — saving fallback lead`)

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        account_id:      account.id,
        customer_phone:  from,
        customer_name:   null,
        job_description: null,
        channel:         'call',
        status:          'new',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[voice/status] Failed to insert fallback lead:', error)
    } else {
      console.log(`[voice/status] Fallback lead saved: ${lead.id}`)

      // Link the fallback lead to the conversation
      await supabase
        .from('conversations')
        .update({ lead_id: lead.id })
        .eq('id', conversation.id)
    }

    return new NextResponse('ok', { status: 200 })
  } catch (error) {
    console.error('[voice/status] Unhandled error:', error)
    return new NextResponse('error', { status: 500 })
  }
}
