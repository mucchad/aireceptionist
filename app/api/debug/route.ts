import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'NOT SET'
  const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) ?? 'NOT SET'

  try {
    const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: d1 } = await supabase.from('accounts').select('id, name')
    const { data: d2 } = await supabase.from('accounts').select('id, name').order('created_at', { ascending: false })
    const { data: d3, error } = await supabase.from('accounts').select('*')
    return NextResponse.json({ url, keyPrefix, noOrder: d1?.length, withOrder: d2?.length, starCount: d3?.length, error: error?.message })
  } catch (e) {
    return NextResponse.json({ url, keyPrefix, caught: String(e) })
  }
}
