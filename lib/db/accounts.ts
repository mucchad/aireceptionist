// Database functions for accounts
// All Supabase queries related to accounts live here

import { createClient } from '@supabase/supabase-js'
import type { Account, KnowledgeBaseSource } from '@/types'

// Server-side Supabase client — uses the service role key for full access
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key)
}

// Create a new account
export async function createAccount(data: {
  name: string
  type: string
  persona_name: string
  emergency_protocol: Account['emergency_protocol']
  emergency_contact?: string
}): Promise<Account> {
  const supabase = getSupabase()
  const { data: account, error } = await supabase
    .from('accounts')
    .insert({
      name: data.name,
      type: data.type,
      persona_name: data.persona_name,
      emergency_protocol: data.emergency_protocol,
      emergency_contact: data.emergency_contact ?? null,
      status: 'poc',
      notify_sms: true,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create account: ${error.message}`)
  return account
}

// Save knowledge base sources for an account
export async function saveKnowledgeBaseSources(
  accountId: string,
  sources: Array<{
    type: KnowledgeBaseSource['type']
    url?: string
    content: string
  }>
): Promise<void> {
  const supabase = getSupabase()
  const rows = sources.map((s) => ({
    account_id: accountId,
    type: s.type,
    url: s.url ?? null,
    content: s.content,
  }))

  const { error } = await supabase.from('knowledge_base_sources').insert(rows)
  if (error) throw new Error(`Failed to save knowledge base sources: ${error.message}`)
}

// Get all active (non-deleted) accounts for the admin list
// Filter deleted_at in JS — Supabase .is() filter can be unreliable after schema changes
export async function getAccounts(): Promise<Account[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, type, status, persona_name, twilio_phone_number, dashboard_token, logo_url, emergency_protocol, notify_sms, deleted_at, created_at, updated_at')

  if (error) throw new Error(`Failed to fetch accounts: ${error.message}`)
  return (data ?? [])
    .filter((a) => !a.deleted_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Get all soft-deleted accounts
export async function getDeletedAccounts(): Promise<Account[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, type, status, persona_name, twilio_phone_number, dashboard_token, logo_url, emergency_protocol, notify_sms, deleted_at, created_at, updated_at')

  if (error) throw new Error(`Failed to fetch accounts: ${error.message}`)
  return (data ?? [])
    .filter((a) => !!a.deleted_at)
    .sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime())
}

// Get a single account by ID
export async function getAccount(id: string): Promise<Account | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
