// API route: POST /api/twilio/voice/respond/process
// Receives speech text via query params (passed from /respond after the filler phrase)
// Calls Claude, saves the lead if captured, and returns the spoken response

import { NextResponse } from 'next/server'
import { getAccountByPhone, getPrimaryContact, sendSms, buildVoiceTwiml } from '@/lib/twilio/client'
import { getOrCreateConversation, appendMessage, linkConversationToLead } from '@/lib/db/conversations'
import { buildSystemPrompt, runAlex } from '@/lib/ai/alex'
import { createClient } from '@supabase/supabase-js'

const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid      = searchParams.get('callSid')  as string
    const to           = searchParams.get('to')        as string
    const from         = searchParams.get('from')      as string
    const speechResult = searchParams.get('speech')    as string
    const isWrapUp     = searchParams.get('wrap') === '1'

    console.log(`[voice/process] callSid=${callSid} to=${to} from=${from} speech="${speechResult}"`)

    const account = await getAccountByPhone(to)
    if (!account) {
      console.error(`[voice/process] No account found for number: ${to}`)
      const twiml = buildVoiceTwiml("Sorry, something went wrong. Please call back later.", undefined, true)
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
    }
    console.log(`[voice/process] Account: ${account.name} (${account.id})`)

    const conversation = await getOrCreateConversation(account.id, callSid, 'call', callSid)
    console.log(`[voice/process] Conversation: ${conversation.id} lead_id=${conversation.lead_id ?? 'none'} history=${conversation.messages.length} msgs`)

    const userMessage = {
      role: 'user' as const,
      content: speechResult,
      timestamp: new Date().toISOString(),
    }
    await appendMessage(conversation.id, userMessage)

    const systemPrompt = buildSystemPrompt(account)
    console.log('[voice/process] Calling Claude...')
    const { message, leadCaptured, leadData } = await runAlex(
      systemPrompt,
      conversation.messages,
      speechResult
    )
    console.log(`[voice/process] Claude response: "${message}" leadCaptured=${leadCaptured} leadData=${JSON.stringify(leadData ?? null)}`)

    const assistantMessage = {
      role: 'assistant' as const,
      content: message,
      timestamp: new Date().toISOString(),
    }
    await appendMessage(conversation.id, assistantMessage)

    if (leadCaptured && leadData && !conversation.lead_id) {
      console.log(`[voice/process] Saving lead for ${leadData.name}...`)
      const supabase = getSupabase()

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          account_id: account.id,
          customer_name: leadData.name,
          customer_phone: from,
          job_description: leadData.job,
          service_address: leadData.address ?? null,
          channel: 'call',
          status: 'new',
        })
        .select()
        .single()

      if (leadError) {
        console.error('[voice/process] Failed to insert lead:', leadError)
      } else {
        console.log(`[voice/process] Lead saved: ${lead.id}`)
        await linkConversationToLead(conversation.id, lead.id)

        if (account.notify_sms) {
          const contact = await getPrimaryContact(account.id)
          if (contact?.phone) {
            const notificationText =
              `📬 New lead from ${leadData.name}!\n` +
              `📱 ${from}\n` +
              `🔧 ${leadData.job}\n` +
              `View: ${PRODUCTION_URL}/dashboard/${account.dashboard_token}`
            await sendSms(contact.phone, to, notificationText)
          }
        }
      }
    } else if (leadCaptured && conversation.lead_id) {
      console.log(`[voice/process] Lead already exists for this conversation: ${conversation.lead_id} — skipping`)
    }

    const respondUrl = `${PRODUCTION_URL}/api/twilio/voice/respond?callSid=${callSid}&to=${encodeURIComponent(to)}`
    const wrapUrl    = `${PRODUCTION_URL}/api/twilio/voice/respond?callSid=${callSid}&to=${encodeURIComponent(to)}&wrap=1`

    let twiml: string
    if (isWrapUp) {
      // Customer has responded after "anything else?" — say goodbye and hang up
      twiml = buildVoiceTwiml(message, undefined, true)
    } else if (leadCaptured) {
      // Lead just captured — always append the "anything else?" question regardless
      // of what Claude said, so the call never ends abruptly
      const withFollowUp = `${message} Is there anything else I can help you with?`
      twiml = buildVoiceTwiml(withFollowUp, wrapUrl)
    } else {
      twiml = buildVoiceTwiml(message, respondUrl)
    }

    console.log(`[voice/process] Responding — isWrapUp=${isWrapUp} leadCaptured=${leadCaptured}`)
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  } catch (error) {
    console.error('[voice/process] Unhandled error:', error)
    const twiml = buildVoiceTwiml("I'm sorry, I ran into a problem. Please try calling back shortly.", undefined, true)
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  }
}
