import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'NOT SET'
  const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) ?? 'NOT SET'

  try {
    const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await supabase.from('accounts').select('id, name')
    return NextResponse.json({ url, keyPrefix, count: data?.length ?? 0, accounts: data, error: error?.message })
  } catch (e) {
    return NextResponse.json({ url, keyPrefix, error: String(e) })
  }
}
