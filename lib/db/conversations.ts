// Database functions for conversations
// Stores the full message history for every call and SMS thread

import { createClient } from '@supabase/supabase-js'
import type { Conversation, ConversationMessage, LeadChannel } from '@/types'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key)
}

// Get or create a conversation for a customer on a given channel
export async function getOrCreateConversation(
  accountId: string,
  customerPhone: string,
  channel: LeadChannel,
  callSid?: string  // for voice calls — each call is a fresh conversation
): Promise<Conversation> {
  const supabase = getSupabase()

  // For voice: match by callSid stored in customer_phone field
  // For SMS: match by customer phone number (ongoing thread)
  const lookupPhone = channel === 'call' && callSid ? callSid : customerPhone

  const { data: matches } = await supabase
    .from('conversations')
    .select('*')
    .eq('account_id', accountId)
    .eq('customer_phone', lookupPhone)
    .eq('channel', channel)

  const existing = (matches ?? []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null

  if (existing) return existing

  // Create a new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      account_id: accountId,
      channel,
      customer_phone: lookupPhone,
      messages: [],
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create conversation: ${error.message}`)
  return data
}

// Append a message to a conversation
export async function appendMessage(
  conversationId: string,
  message: ConversationMessage
): Promise<void> {
  const supabase = getSupabase()

  // Fetch current messages then append — Supabase doesn't support array push natively
  const { data, error: fetchError } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single()

  if (fetchError) throw new Error(`Failed to fetch conversation: ${fetchError.message}`)

  const messages = [...(data.messages ?? []), message]

  const { error } = await supabase
    .from('conversations')
    .update({ messages, updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (error) throw new Error(`Failed to append message: ${error.message}`)
}

// Get total conversation count for an account (calls + SMS)
export async function getConversationCount(accountId: string): Promise<{ total: number; calls: number; sms: number }> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('conversations')
    .select('channel, account_id')

  if (error) throw new Error(`Failed to fetch conversations: ${error.message}`)

  const rows = (data ?? []).filter((c) => c.account_id === accountId)
  return {
    total: rows.length,
    calls: rows.filter((c) => c.channel === 'call').length,
    sms:   rows.filter((c) => c.channel === 'sms').length,
  }
}

// Link a conversation to a lead once captured
export async function linkConversationToLead(
  conversationId: string,
  leadId: string
): Promise<void> {
  const supabase = getSupabase()
  await supabase
    .from('conversations')
    .update({ lead_id: leadId })
    .eq('id', conversationId)
}
