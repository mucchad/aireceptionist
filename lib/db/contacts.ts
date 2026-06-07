// Database functions for contacts
// All Supabase queries related to contacts live here

import { createClient } from '@supabase/supabase-js'
import type { Contact } from '@/types'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key)
}

// Create a primary contact for an account
export async function createPrimaryContact(data: {
  account_id: string
  name: string
  phone?: string
  email?: string
  role?: Contact['role']
}): Promise<Contact> {
  const supabase = getSupabase()
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      account_id: data.account_id,
      name: data.name,
      phone: data.phone ?? null,
      email: data.email ?? null,
      role: data.role ?? 'owner',
      is_primary: true,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create contact: ${error.message}`)
  return contact
}

// Get all contacts for an account
export async function getContacts(accountId: string): Promise<Contact[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('account_id', accountId)
  if (error) throw new Error(`Failed to fetch contacts: ${error.message}`)
  return (data ?? []).sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
}
