// API route: POST /api/twilio/voice
// First webhook hit when a customer calls a business number
// Responds with a greeting and starts listening

import { NextResponse } from 'next/server'
import { getAccountByPhone } from '@/lib/twilio/client'
import { buildVoiceTwiml } from '@/lib/twilio/client'
import { getOrCreateConversation } from '@/lib/db/conversations'

const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const to      = formData.get('To')      as string  // business number
    const callSid = formData.get('CallSid') as string  // unique ID for this call

    // Look up the account
    const account = await getAccountByPhone(to)
    if (!account) {
      const twiml = buildVoiceTwiml("Sorry, this number is not currently active. Goodbye.", undefined, true)
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
    }

    // Create a conversation for this call (keyed by CallSid)
    await getOrCreateConversation(account.id, callSid, 'call', callSid)

    // Greet the caller and start listening
    const greeting = `Hi there! Thanks for calling ${account.name}. I'm ${account.persona_name}, how can I help you today?`
    const respondUrl = `${PRODUCTION_URL}/api/twilio/voice/respond?callSid=${callSid}&to=${encodeURIComponent(to)}`
    const twiml = buildVoiceTwiml(greeting, respondUrl)

    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  } catch (error) {
    console.error('Voice handler error:', error)
    const twiml = buildVoiceTwiml("Sorry, we're experiencing technical difficulties. Please try again shortly.", undefined, true)
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  }
}
