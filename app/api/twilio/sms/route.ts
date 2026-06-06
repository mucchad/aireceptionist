// API route: POST /api/twilio/sms
// Handles inbound SMS messages from Twilio
// Flow: customer texts → Alex responds → lead captured → notify owner
// Must respond within 15 seconds (Twilio's webhook timeout)

import { NextResponse } from 'next/server'
import { getAccountByPhone, getPrimaryContact, sendSms } from '@/lib/twilio/client'
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

function twimlResponse(message: string) {
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return new NextResponse(
    `<?xml version="1.0"?><Response><Message>${safe}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const from = formData.get('From') as string  // customer's phone number
    const to   = formData.get('To')   as string  // business's Twilio number
    const body = formData.get('Body') as string  // customer's message

    // 1. Look up which account owns this Twilio number
    const account = await getAccountByPhone(to)
    if (!account) {
      return new NextResponse('<?xml version="1.0"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // 2. Get or create conversation, then run Alex — parallelise the message save
    const conversation = await getOrCreateConversation(account.id, from, 'sms')

    const userMessage = {
      role: 'user' as const,
      content: body,
      timestamp: new Date().toISOString(),
    }

    // Run Claude and save the user message at the same time
    const systemPrompt = buildSystemPrompt(account)
    const [alexResult] = await Promise.all([
      runAlex(systemPrompt, conversation.messages, body),
      appendMessage(conversation.id, userMessage),
    ])

    const { message, leadCaptured, leadData } = alexResult

    // 3. Save Alex's reply
    const assistantMessage = {
      role: 'assistant' as const,
      content: message,
      timestamp: new Date().toISOString(),
    }
    await appendMessage(conversation.id, assistantMessage)

    // 4. If lead captured — save and notify in background (don't block the response)
    if (leadCaptured && leadData && !conversation.lead_id) {
      const supabase = getSupabase()

      supabase
        .from('leads')
        .insert({
          account_id: account.id,
          customer_name: leadData.name,
          customer_phone: from,
          job_description: leadData.job,
          channel: 'sms',
          status: 'new',
        })
        .select()
        .single()
        .then(async ({ data: lead }) => {
          if (!lead) return

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
        })
        .catch((err) => console.error('Lead capture error:', err))
    }

    // 5. Reply to the customer immediately
    return twimlResponse(message)

  } catch (error) {
    console.error('SMS handler error:', error)
    return twimlResponse("Sorry, I'm having trouble right now. Please try again in a moment.")
  }
}
