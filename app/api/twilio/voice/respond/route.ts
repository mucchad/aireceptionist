// API route: POST /api/twilio/voice/respond
// Called by Twilio after each customer speech input during a call
// Immediately acknowledges with a filler phrase, then redirects to /process
// where the actual Claude call happens — this hides the AI thinking time

import { NextResponse } from 'next/server'
import { buildVoiceTwiml } from '@/lib/twilio/client'

const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid = searchParams.get('callSid') as string
    const to      = searchParams.get('to')       as string

    const formData     = await request.formData()
    const speechResult = formData.get('SpeechResult') as string
    const from         = formData.get('From')          as string

    console.log(`[voice/respond] callSid=${callSid} to=${to} from=${from} speech="${speechResult}"`)

    if (!speechResult) {
      console.log('[voice/respond] No speech detected — reprompting')
      const twiml = buildVoiceTwiml(
        "Sorry, I didn't catch that. Could you say that again?",
        `${PRODUCTION_URL}/api/twilio/voice/respond?callSid=${callSid}&to=${encodeURIComponent(to)}`
      )
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
    }

    // Immediately return a filler phrase and redirect to /process
    // Twilio speaks the filler while simultaneously hitting /process — hiding Claude's latency
    const processUrl =
      `${PRODUCTION_URL}/api/twilio/voice/respond/process` +
      `?callSid=${callSid}&to=${encodeURIComponent(to)}&from=${encodeURIComponent(from)}&speech=${encodeURIComponent(speechResult)}`

    const VoiceResponse = (await import('twilio')).default.twiml.VoiceResponse
    const twiml = new VoiceResponse()
    twiml.say({ voice: 'Polly.Joanna-Neural', language: 'en-US' }, 'One moment.')
    twiml.redirect({ method: 'POST' }, processUrl)

    console.log(`[voice/respond] Filler sent, redirecting to process`)
    return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } })
  } catch (error) {
    console.error('[voice/respond] Unhandled error:', error)
    const twiml = buildVoiceTwiml("I'm sorry, I ran into a problem. Please try calling back shortly.", undefined, true)
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  }
}
