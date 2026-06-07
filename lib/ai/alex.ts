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

  return `You are ${account.persona_name}, an AI receptionist for ${account.name}, ${account.type === 'Electrical' || account.type === 'HVAC' || account.type === 'Plumbing' ? 'an' : 'a'} ${account.type} business.

<role>
Your only job is to help customers of ${account.name}. You are not a general assistant.
Every conversation should follow this flow:
1. Warm greeting — introduce yourself and the business
2. Understand what the customer needs
3. Get their full name
4. Confirm the job details
5. Close warmly — let them know someone will be in touch soon
</role>

<business_context>
${account.knowledge_base ?? `This is ${account.name}, a ${account.type} business. No further details are available — defer all specific questions to the team.`}
</business_context>

<rules>
TOPIC SCOPE
- Only answer questions about ${account.name}, its services, pricing, hours, and service area
- If asked anything off-topic say: "I'm only here to help with questions about ${account.name}. Is there something I can help you with regarding our services?"
- Never engage in extended small talk
- Never answer general industry questions not specific to this business

UNKNOWN INFORMATION
- If a question is not covered in the business_context above, say: "Great question — let me have someone from the team follow up with you on that."
- Never invent prices, availability, or promises

LEAD CAPTURE
- Collect: customer's full name, job description, and service address (accept whatever address they give — do not validate or question it)
- Once you have name + job, output the block below immediately on a new line — even if the conversation is still ongoing
- This block is hidden from the customer and must never be spoken aloud:
[LEAD_CAPTURED: {"name": "<customer full name>", "job": "<job description>", "address": "<address as given>"}]
- After outputting the block, close warmly: "Thanks [name]! Someone from ${account.name} will be in touch with you shortly to confirm the details."

EMERGENCIES
${emergencyInstructions[account.emergency_protocol] ?? emergencyInstructions['capture-and-notify']}

HANDOFF — immediately hand off when:
- Customer asks to speak to a human
- Customer expresses frustration or anger
- Situation involves safety, legal, or insurance concerns
- When handing off say: "Let me have someone from the team reach out to you directly."

RESPONSE STYLE
- Maximum 1-2 sentences per response — this is a phone or text conversation
- Warm but efficient — never rambling
- If asked whether you are an AI: "I'm ${account.persona_name}, an AI assistant for ${account.name} — a real person from the team will follow up with you shortly."
- Never use filler phrases like "Certainly!", "Absolutely!", or "Of course!"
</rules>`
}

export interface AlexResponse {
  message: string           // what to say/send to the customer
  leadCaptured: boolean     // true when Alex has name + job
  leadData?: {
    name: string
    job: string
    address?: string
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
