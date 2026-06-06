// ============================================================
// Shared TypeScript types across the entire app
// ============================================================

// ------------------------------------------------------------
// Business (Tenant)
// ------------------------------------------------------------
export type BusinessStatus = 'poc' | 'live' | 'cancelled'

export type EmergencyProtocol = 'capture-and-notify' | 'direct-number' | 'immediate-sms'

export interface Business {
  id: string
  name: string
  type: string                    // e.g. "plumbing", "HVAC", "fence installation"
  status: BusinessStatus
  twilio_phone_number: string
  dashboard_token: string         // secret token for their private dashboard URL
  persona_name: string            // defaults to "Alex"
  emergency_protocol: EmergencyProtocol
  emergency_contact?: string      // phone number for direct-number protocol
  knowledge_base: string          // compiled text fed into the system prompt
  notify_sms: boolean
  notify_email: boolean
  owner_name: string
  owner_phone: string
  owner_email: string
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// Knowledge Base Sources (inputs for building the knowledge base)
// ------------------------------------------------------------
export interface KnowledgeBaseSource {
  id: string
  business_id: string
  type: 'website' | 'google_maps' | 'facebook' | 'yelp' | 'manual'
  url?: string                    // for scraped sources
  content: string                 // scraped or manually entered text
  created_at: string
}

// ------------------------------------------------------------
// Lead (captured from a call or SMS)
// ------------------------------------------------------------
export type LeadChannel = 'call' | 'sms'
export type LeadStatus = 'new' | 'contacted' | 'resolved'

export interface Lead {
  id: string
  business_id: string
  customer_name?: string
  customer_phone: string
  job_description?: string
  channel: LeadChannel
  status: LeadStatus
  conversation_id?: string        // links to full conversation transcript
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
  business_id: string
  lead_id?: string
  channel: LeadChannel
  customer_phone: string
  messages: ConversationMessage[]
  created_at: string
  updated_at: string
}
