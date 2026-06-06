// API route: POST /api/twilio/sms
// Handles inbound SMS messages from Twilio
// Flow: customer texts → Alex responds → lead captured → notify owner

import { NextResponse } from 'next/server'
import { getAccountByPhone, getPrimaryContact, sendSms } from '@/lib/twilio/client'
import { getOrCreateConversation, appendMessage, linkConversationToLead } from '@/lib/db/conversations'
import { buildSystemPrompt, runAlex } from '@/lib/ai/alex'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const from     = formData.get('From') as string  // customer's phone number
    const to       = formData.get('To')   as string  // business's Twilio number
    const body     = formData.get('Body') as string  // customer's message

    // 1. Look up which account owns this Twilio number
    const account = await getAccountByPhone(to)
    if (!account) {
      // Number not linked to any account — ignore silently
      return new NextResponse('<?xml version="1.0"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // 2. Get or create a conversation for this customer
    const conversation = await getOrCreateConversation(account.id, from, 'sms')

    // 3. Save the customer's incoming message
    const userMessage = {
      role: 'user' as const,
      content: body,
      timestamp: new Date().toISOString(),
    }
    await appendMessage(conversation.id, userMessage)

    // 4. Build Alex's system prompt and run the conversation through Claude
    const systemPrompt = buildSystemPrompt(account)
    const { message, leadCaptured, leadData } = await runAlex(
      systemPrompt,
      conversation.messages,
      body
    )

    // 5. Save Alex's reply
    const assistantMessage = {
      role: 'assistant' as const,
      content: message,
      timestamp: new Date().toISOString(),
    }
    await appendMessage(conversation.id, assistantMessage)

    // 6. If a lead was captured, save it and notify the business owner
    if (leadCaptured && leadData && !conversation.lead_id) {
      const supabase = getSupabase()

      // Create the lead
      const { data: lead } = await supabase
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

      if (lead) {
        // Link conversation to lead
        await linkConversationToLead(conversation.id, lead.id)

        // Notify the business owner via SMS if enabled
        if (account.notify_sms) {
          const contact = await getPrimaryContact(account.id)
          if (contact?.phone) {
            const notificationText =
              `📬 New lead from ${leadData.name}!\n` +
              `📱 ${from}\n` +
              `🔧 ${leadData.job}\n` +
              `View: ${process.env.NEXT_PUBLIC_PRODUCTION_URL}/dashboard/${account.dashboard_token}`
            await sendSms(contact.phone, to, notificationText)
          }
        }
      }
    }

    // 7. Reply to the customer via Twilio TwiML
    const twiml = `<?xml version="1.0"?>
<Response>
  <Message>${message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Message>
</Response>`

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('SMS handler error:', error)
    // Always return a valid TwiML response so Twilio doesn't retry
    return new NextResponse(
      '<?xml version="1.0"?><Response><Message>Sorry, I\'m having trouble right now. Please call us directly.</Message></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }
}
