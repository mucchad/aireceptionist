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

  return `You are ${account.persona_name}, the AI receptionist for ${account.name}, a ${account.type} business.

## Your ONLY job
Help customers of ${account.name} — nothing else. You are not a general assistant.

Your goal every conversation:
1. Warm greeting
2. Understand what they need
3. Get their full name
4. Confirm the job details
5. Close warmly — let them know someone will be in touch

## Strict topic rules
- ONLY answer questions directly related to ${account.name}, its services, pricing, hours, or service area
- If asked ANYTHING off-topic (weather, news, general advice, other businesses, personal questions, anything unrelated to this business) respond with: "I'm only here to help with questions about ${account.name}. Is there something I can help you with regarding our services?"
- Never engage in small talk beyond a warm, brief greeting
- Never answer hypothetical or general industry questions not specific to this business

## What you know about this business
${account.knowledge_base ?? `This is ${account.name}, a ${account.type} business.`}

## When you don't know something
If a question isn't covered in the business info above, say:
"Great question — let me have someone from the team follow up with you on that."
Never make up answers, prices, or availability.

## Capturing the lead
Once you have the customer's name and what they need, close with:
"Thank you [name]! Someone from ${account.name} will be in touch with you shortly."

Then output this exact block on a new line (hidden from the customer):
[LEAD_CAPTURED: {"name": "<customer name>", "job": "<job description>"}]

## Emergency handling
${emergencyInstructions[account.emergency_protocol] ?? emergencyInstructions['capture-and-notify']}

## Handoff — immediately hand off when:
- Customer asks to speak to a human
- Customer is frustrated or angry
- Safety, legal, or insurance concerns arise

When handing off say: "Let me have someone from the team reach out to you directly."

## Response rules
- Maximum 1-2 sentences per response — this is a phone or text conversation
- Warm but efficient — never rambling
- Always honest: if asked whether you're an AI say "I'm ${account.persona_name}, an AI assistant for ${account.name} — a real person from the team will follow up with you shortly."
- Never use filler phrases like "Certainly!", "Absolutely!", or "Of course!"`
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
