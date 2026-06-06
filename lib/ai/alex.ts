// Alex — AI Receptionist brain
// Builds the system prompt and runs conversations through Claude

import Anthropic from '@anthropic-ai/sdk'
import type { ConversationMessage } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Build Alex's system prompt from the account's settings and knowledge base
export function buildSystemPrompt(account: {
  name: string
  type: string
  persona_name: string
  emergency_protocol: string
  emergency_contact?: string
  knowledge_base?: string
}): string {
  const emergencyInstructions: Record<string, string> = {
    'capture-and-notify':
      'For emergencies, tell the customer: "This sounds urgent — I\'m flagging this right now and someone will call you back within the hour."',
    'immediate-sms':
      'For emergencies, tell the customer you\'re alerting the team immediately, and someone will be in touch very shortly.',
    'direct-number':
      `For true emergencies, give the customer this direct number: ${account.emergency_contact ?? 'the business directly'}.`,
  }

  return `You are ${account.persona_name}, the friendly AI receptionist for ${account.name}, a ${account.type} business.

## Your personality
- Warm, helpful, and conversational — like a real person who genuinely cares
- Never robotic or stiff
- Represent a local business that values its customers

## What you know about this business
${account.knowledge_base ?? `This is ${account.name}, a ${account.type} business. Answer general questions warmly and capture the customer's needs.`}

## Your job
Your primary goal is to help the customer and capture three pieces of information:
1. Their FULL NAME
2. What they need (job description — be specific, ask follow-up questions if needed)
3. Their phone number is already known — do not ask for it

Once you have their name and what they need, wrap up warmly and let them know someone will be in touch.

## When you have enough information
When you have the customer's name and job description, end the conversation naturally with:
"Thank you [name]! Someone from ${account.name} will be in touch with you shortly."

Then output this exact block on a new line (this is hidden from the customer):
[LEAD_CAPTURED: {"name": "<customer name>", "job": "<job description>"}]

## Emergency handling
${emergencyInstructions[account.emergency_protocol] ?? emergencyInstructions['capture-and-notify']}

## When you don't know something
If a question isn't covered in the business info above, say:
"That's a great question — let me have someone from the team follow up with you on that specifically."

## Handoff triggers — always hand off when:
- The customer asks to speak to a human
- The customer is frustrated or angry
- Safety, legal, or insurance concerns come up

When handing off: "I want to make sure you get the best help — let me have the team reach out to you directly."

## Important rules
- Never make up prices, availability, or specific details not in the knowledge base
- Always be honest that you're an AI if asked directly: "I'm ${account.persona_name}, an AI assistant helping ${account.name} make sure every customer gets a quick response!"
- Keep responses concise — this is a phone/text conversation, not an essay
- One or two sentences at a time for voice calls`
}

export interface AlexResponse {
  message: string           // what to say/send to the customer
  leadCaptured: boolean     // true when Alex has name + job
  leadData?: {
    name: string
    job: string
  }
}

// Run a message through Alex and get a response
export async function runAlex(
  systemPrompt: string,
  history: ConversationMessage[],  // full conversation so far
  newMessage: string               // latest customer message
): Promise<AlexResponse> {
  // Build the messages array for Claude
  const messages: Anthropic.MessageParam[] = [
    // Include conversation history
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    // Add the new customer message
    { role: 'user' as const, content: newMessage },
  ]

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const fullText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  // Check if Alex captured a lead
  const leadMatch = fullText.match(/\[LEAD_CAPTURED:\s*({.*?})\]/s)
  let leadCaptured = false
  let leadData: { name: string; job: string } | undefined

  if (leadMatch) {
    try {
      leadData = JSON.parse(leadMatch[1])
      leadCaptured = true
    } catch {
      // Malformed JSON — ignore, continue conversation
    }
  }

  // Strip the hidden [LEAD_CAPTURED:...] block from the customer-facing message
  const message = fullText.replace(/\[LEAD_CAPTURED:.*?\]/s, '').trim()

  return { message, leadCaptured, leadData }
}
