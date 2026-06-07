// API route: POST /api/twilio/voice/respond
// Called by Twilio after each customer speech input during a call
// Processes the speech, runs through Claude, responds with next message

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
    const callSid  = searchParams.get('callSid') as string
    const to       = searchParams.get('to')       as string  // business number

    const formData      = await request.formData()
    const speechResult  = formData.get('SpeechResult')  as string  // transcribed speech
    const from          = formData.get('From')           as string  // customer phone

    // If no speech was detected, prompt again
    if (!speechResult) {
      const twiml = buildVoiceTwiml(
        "Sorry, I didn't catch that. Could you say that again?",
        `${PRODUCTION_URL}/api/twilio/voice/respond?callSid=${callSid}&to=${encodeURIComponent(to)}`
      )
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
    }

    // Look up the account
    const account = await getAccountByPhone(to)
    if (!account) {
      const twiml = buildVoiceTwiml("Sorry, something went wrong. Please call back later.", undefined, true)
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
    }

    // Get the conversation for this call
    const conversation = await getOrCreateConversation(account.id, callSid, 'call', callSid)

    // Save the customer's spoken message
    const userMessage = {
      role: 'user' as const,
      content: speechResult,
      timestamp: new Date().toISOString(),
    }
    await appendMessage(conversation.id, userMessage)

    // Run through Claude
    const systemPrompt = buildSystemPrompt(account)
    const { message, leadCaptured, leadData } = await runAlex(
      systemPrompt,
      conversation.messages,
      speechResult
    )

    // Save Alex's response
    const assistantMessage = {
      role: 'assistant' as const,
      content: message,
      timestamp: new Date().toISOString(),
    }
    await appendMessage(conversation.id, assistantMessage)

    // If lead captured — save to DB and notify owner
    if (leadCaptured && leadData && !conversation.lead_id) {
      const supabase = getSupabase()

      const { data: lead } = await supabase
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

      if (lead) {
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
    }

    // Build the TwiML response
    const respondUrl = `${PRODUCTION_URL}/api/twilio/voice/respond?callSid=${callSid}&to=${encodeURIComponent(to)}`

    // If lead is captured, say goodbye and hang up
    // Otherwise keep the conversation going
    const twiml = leadCaptured
      ? buildVoiceTwiml(message, undefined, true)
      : buildVoiceTwiml(message, respondUrl)

    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  } catch (error) {
    console.error('Voice respond error:', error)
    const twiml = buildVoiceTwiml("I'm sorry, I ran into a problem. Please try calling back shortly.", undefined, true)
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  }
}
