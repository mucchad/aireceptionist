// API routes: GET /api/accounts/[id] and PATCH /api/accounts/[id]
// GET: load a single account + its knowledge base sources + primary contact
// PATCH: update account details and knowledge base

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase()

    const [accountRes, sourcesRes, contactRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('id', params.id).single(),
      supabase.from('knowledge_base_sources').select('*').eq('account_id', params.id),
      supabase.from('contacts').select('*').eq('account_id', params.id).eq('is_primary', true).single(),
    ])

    if (accountRes.error || !accountRes.data) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({
      account: accountRes.data,
      sources: sourcesRes.data ?? [],
      contact: contactRes.data ?? null,
    })
  } catch (error) {
    console.error('Failed to load account:', error)
    return NextResponse.json({ error: 'Failed to load account' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const supabase = getSupabase()

    const {
      name,
      type,
      persona_name,
      emergency_protocol,
      emergency_contact,
      manual_content,
      website_url,
      google_maps_url,
      facebook_url,
      yelp_url,
      contact_name,
      contact_phone,
      contact_email,
    } = body

    // 1. Update the account record
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .update({
        name,
        type,
        persona_name,
        emergency_protocol,
        emergency_contact: emergency_contact || null,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (accountError) throw new Error(accountError.message)

    // 2. Replace knowledge base sources — delete old ones, insert new ones
    await supabase.from('knowledge_base_sources').delete().eq('account_id', params.id)

    const sources: { account_id: string; type: string; url: string | null; content: string }[] = []
    if (website_url?.trim())
      sources.push({ account_id: params.id, type: 'website', url: website_url.trim(), content: website_url.trim() })
    if (google_maps_url?.trim())
      sources.push({ account_id: params.id, type: 'google_maps', url: google_maps_url.trim(), content: google_maps_url.trim() })
    if (facebook_url?.trim())
      sources.push({ account_id: params.id, type: 'facebook', url: facebook_url.trim(), content: facebook_url.trim() })
    if (yelp_url?.trim())
      sources.push({ account_id: params.id, type: 'yelp', url: yelp_url.trim(), content: yelp_url.trim() })
    if (manual_content?.trim())
      sources.push({ account_id: params.id, type: 'manual', url: null, content: manual_content.trim() })

    if (sources.length > 0) {
      const { error: sourcesError } = await supabase.from('knowledge_base_sources').insert(sources)
      if (sourcesError) throw new Error(sourcesError.message)
    }

    // 3. Update or upsert the primary contact
    const existingContact = await supabase
      .from('contacts')
      .select('id')
      .eq('account_id', params.id)
      .eq('is_primary', true)
      .single()

    if (existingContact.data?.id) {
      await supabase
        .from('contacts')
        .update({
          name: contact_name,
          phone: contact_phone,
          email: contact_email || null,
        })
        .eq('id', existingContact.data.id)
    } else {
      await supabase.from('contacts').insert({
        account_id: params.id,
        name: contact_name,
        phone: contact_phone,
        email: contact_email || null,
        is_primary: true,
      })
    }

    // 4. Rebuild the knowledge_base text on the account
    // Combine all manual content into the account's knowledge_base field
    const kbText = [
      manual_content?.trim(),
      website_url?.trim() ? `Website: ${website_url.trim()}` : '',
      google_maps_url?.trim() ? `Google Maps: ${google_maps_url.trim()}` : '',
      facebook_url?.trim() ? `Facebook: ${facebook_url.trim()}` : '',
      yelp_url?.trim() ? `Yelp: ${yelp_url.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    await supabase
      .from('accounts')
      .update({ knowledge_base: kbText || null })
      .eq('id', params.id)

    return NextResponse.json({ account })
  } catch (error) {
    console.error('Failed to update account:', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}
