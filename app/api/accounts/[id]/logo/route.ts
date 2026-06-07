// API route: POST /api/accounts/[id]/logo
// Accepts a logo image upload, stores it in Supabase Storage, saves URL to account

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase()
    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${params.id}/logo.${ext}`
    const buffer = await file.arrayBuffer()

    // Upload to Supabase Storage (upsert — replaces existing logo)
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw new Error(uploadError.message)

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(path)

    // Save URL to the account record
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ logo_url: publicUrl })
      .eq('id', params.id)

    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ logo_url: publicUrl })
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
  }
}
