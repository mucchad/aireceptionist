// API route: POST /api/businesses
// Creates a new account + primary contact + knowledge base sources

import { NextResponse } from 'next/server'
import { createAccount, saveKnowledgeBaseSources } from '@/lib/db/accounts'
import { createPrimaryContact } from '@/lib/db/contacts'
import type { KnowledgeBaseSource } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      // Step 1 — Business basics
      name,
      type,
      persona_name,
      emergency_protocol,
      emergency_contact,
      // Step 2 — Knowledge base sources
      sources,
      // Step 3 — Primary contact
      contact_name,
      contact_phone,
      contact_email,
    } = body

    // Validate required fields
    if (!name || !type || !contact_name) {
      return NextResponse.json(
        { error: 'Account name, type, and contact name are required' },
        { status: 400 }
      )
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json(
        { error: 'At least one knowledge base source is required' },
        { status: 400 }
      )
    }

    // 1. Create the account
    const account = await createAccount({
      name,
      type,
      persona_name: persona_name || 'Alex',
      emergency_protocol: emergency_protocol || 'capture-and-notify',
      emergency_contact,
    })

    // 2. Save knowledge base sources
    await saveKnowledgeBaseSources(account.id, sources)

    // 3. Create the primary contact
    await createPrimaryContact({
      account_id: account.id,
      name: contact_name,
      phone: contact_phone,
      email: contact_email,
      role: 'owner',
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error('Failed to create account:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
