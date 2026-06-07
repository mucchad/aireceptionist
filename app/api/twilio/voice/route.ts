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
    const to      = formData.get('To')      as string
    const from    = formData.get('From')    as string
    const callSid = formData.get('CallSid') as string

    console.log(`[voice] Incoming call — to=${to} from=${from} callSid=${callSid}`)

    const account = await getAccountByPhone(to)
    if (!account) {
      console.error(`[voice] No account found for number: ${to}`)
      const twiml = buildVoiceTwiml("Sorry, this number is not currently active. Goodbye.", undefined, true)
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
    }
    console.log(`[voice] Account found: ${account.name} (${account.id})`)

    const conversation = await getOrCreateConversation(account.id, callSid, 'call', callSid)
    console.log(`[voice] Conversation created: ${conversation.id}`)

    const greeting = `Hi there! Thanks for calling ${account.name}. I'm ${account.persona_name}, how can I help you today?`
    const respondUrl = `${PRODUCTION_URL}/api/twilio/voice/respond?callSid=${callSid}&to=${encodeURIComponent(to)}`
    const twiml = buildVoiceTwiml(greeting, respondUrl)

    console.log(`[voice] Greeting sent, listening at: ${respondUrl}`)
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  } catch (error) {
    console.error('[voice] Unhandled error:', error)
    const twiml = buildVoiceTwiml("Sorry, we're experiencing technical difficulties. Please try again shortly.", undefined, true)
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  }
}
