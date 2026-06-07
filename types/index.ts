// ============================================================
// Shared TypeScript types across the entire app
// ============================================================

// ------------------------------------------------------------
// Account (one per business you onboard)
// ------------------------------------------------------------
export type AccountStatus = 'poc' | 'live' | 'cancelled'
export type EmergencyProtocol = 'capture-and-notify' | 'direct-number' | 'immediate-sms'

export interface Account {
  id: string
  name: string
  type: string                    // e.g. "plumbing", "HVAC", "fence installation"
  status: AccountStatus
  twilio_phone_number?: string
  dashboard_token: string         // secret token for their private dashboard URL
  persona_name: string            // defaults to "Alex"
  emergency_protocol: EmergencyProtocol
  emergency_contact?: string      // phone number for direct-number protocol
  knowledge_base?: string         // compiled text fed into the system prompt
  notify_sms: boolean
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// Contact (people at an account — owner, manager, staff)
// ------------------------------------------------------------
export type ContactRole = 'owner' | 'manager' | 'staff'

export interface Contact {
  id: string
  account_id: string
  name: string
  role: ContactRole
  phone?: string
  email?: string
  is_primary: boolean             // primary contact receives SMS notifications
  created_at: string
}

// ------------------------------------------------------------
// Knowledge Base Source (inputs for building the knowledge base)
// ------------------------------------------------------------
export type KnowledgeBaseSourceType = 'website' | 'google_maps' | 'facebook' | 'yelp' | 'manual'

export interface KnowledgeBaseSource {
  id: string
  account_id: string
  type: KnowledgeBaseSourceType
  url?: string                    // null for manual entries
  content: string                 // scraped or manually entered text
  created_at: string
}

// ------------------------------------------------------------
// Lead (every customer who contacts an account through Alex)
// ------------------------------------------------------------
export type LeadChannel = 'call' | 'sms'
export type LeadStatus = 'new' | 'contacted' | 'resolved'

export interface Lead {
  id: string
  account_id: string
  customer_name?: string
  customer_phone: string
  job_description?: string
  service_address?: string
  channel: LeadChannel
  status: LeadStatus
  created_at: string
}

// ------------------------------------------------------------
// Conversation (full transcript of a call or SMS thread)
// ------------------------------------------------------------
export type MessageRole = 'user' | 'assistant'

export interface ConversationMessage {
  role: MessageRole
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  account_id: string
  lead_id?: string
  channel: LeadChannel
  customer_phone: string
  messages: ConversationMessage[]
  created_at: string
  updated_at: string
}
