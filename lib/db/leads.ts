// Database functions for leads
// All Supabase queries related to leads live here

import { createClient } from '@supabase/supabase-js'
import type { Lead, LeadStatus } from '@/types'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key)
}

// Get all leads for an account, newest first
// Note: filtering in JS because Supabase .eq() on UUID has an issue in this environment
export async function getLeads(accountId: string): Promise<Lead[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('leads')
    .select('*')

  if (error) throw new Error(`Failed to fetch leads: ${error.message}`)
  return (data ?? [])
    .filter((l) => l.account_id === accountId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Update the status of a lead (new → contacted → resolved)
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus
): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)

  if (error) throw new Error(`Failed to update lead status: ${error.message}`)
}

// Get lead counts for an account (used in stat cards)
export async function getLeadCounts(accountId: string): Promise<{
  total: number
  today: number
  thisWeek: number
  byStatus: Record<LeadStatus, number>
}> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('leads')
    .select('status, created_at, account_id')

  if (error) throw new Error(`Failed to fetch lead counts: ${error.message}`)

  const leads = (data ?? []).filter((l) => l.account_id === accountId)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)

  return {
    total: leads.length,
    today: leads.filter((l) => new Date(l.created_at) >= todayStart).length,
    thisWeek: leads.filter((l) => new Date(l.created_at) >= weekStart).length,
    byStatus: {
      new: leads.filter((l) => l.status === 'new').length,
      contacted: leads.filter((l) => l.status === 'contacted').length,
      resolved: leads.filter((l) => l.status === 'resolved').length,
    },
  }
}
