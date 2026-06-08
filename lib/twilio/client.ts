// Twilio helpers — send SMS, build TwiML responses

import twilio from 'twilio'

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) throw new Error('Missing Twilio credentials')
  return twilio(accountSid, authToken)
}

// Send an SMS message
export async function sendSms(to: string, from: string, body: string): Promise<void> {
  const client = getClient()
  await client.messages.create({ to, from, body })
}

// Look up which account owns a given Twilio phone number
// Returns the account from Supabase matching that number
export async function getAccountByPhone(phoneNumber: string) {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('accounts')
    .select('*, knowledge_base')
    .eq('twilio_phone_number', phoneNumber)
    .single()

  if (error || !data) return null
  return data
}

// Get the primary contact for an account (who gets SMS notifications)
export async function getPrimaryContact(accountId: string) {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('contacts')
    .select('*')
    .eq('account_id', accountId)
    .eq('is_primary', true)
    .single()

  return data
}

// Register a status callback on an active call via the REST API
// This is how we detect when a call ends without a lead being captured
export async function registerStatusCallback(callSid: string, statusCallbackUrl: string): Promise<void> {
  const client = getClient()
  await client.calls(callSid).update({
    statusCallback: statusCallbackUrl,
    statusCallbackMethod: 'POST',
  })
}

// Build a TwiML response for voice calls
// Wraps text in <Say> and optionally listens for a reply with <Gather>
export function buildVoiceTwiml(
  message: string,
  gatherAction?: string,  // URL to send the next speech input to
  hangup = false
): string {
  const VoiceResponse = twilio.twiml.VoiceResponse
  const twiml = new VoiceResponse()

  if (gatherAction) {
    // Say the message while gathering the next customer input
    const gather = twiml.gather({
      input: ['speech'],
      action: gatherAction,
      method: 'POST',
      speechTimeout: 'auto',
      language: 'en-US',
    })
    gather.say({ voice: 'Polly.Joanna-Neural', language: 'en-US' }, message)
  } else {
    twiml.say({ voice: 'Polly.Joanna-Neural', language: 'en-US' }, message)
  }

  if (hangup) twiml.hangup()

  return twiml.toString()
}
