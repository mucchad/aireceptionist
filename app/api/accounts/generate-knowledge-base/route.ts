// API route: POST /api/accounts/generate-knowledge-base
// Fetches a business website, strips HTML, and uses Claude to extract
// a structured knowledge base ready for the AI receptionist

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Strip HTML tags and collapse whitespace to get readable plain text
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')   // remove script blocks
    .replace(/<style[\s\S]*?<\/style>/gi, '')      // remove style blocks
    .replace(/<[^>]+>/g, ' ')                      // remove all tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')                       // collapse whitespace
    .trim()
}

export async function POST(request: Request) {
  try {
    const { website_url } = await request.json()

    if (!website_url || typeof website_url !== 'string') {
      return NextResponse.json({ error: 'website_url is required' }, { status: 400 })
    }

    // Ensure the URL has a protocol
    const url = website_url.startsWith('http') ? website_url : `https://${website_url}`

    // Fetch the website
    let html: string
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-Receptionist-Bot/1.0)' },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      html = await res.text()
    } catch (e) {
      return NextResponse.json(
        { error: `Could not fetch the website. Make sure the URL is correct and the site is live.` },
        { status: 422 }
      )
    }

    // Strip HTML and truncate to ~12k chars to keep tokens manageable
    const plainText = stripHtml(html).slice(0, 12000)

    if (plainText.length < 100) {
      return NextResponse.json(
        { error: 'The website returned too little content to parse. It may require JavaScript to load.' },
        { status: 422 }
      )
    }

    // Ask Claude to extract and structure the knowledge base using XML tags
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are setting up a knowledge base for an AI phone receptionist for a small service business.

Extract information from the website content below and output it using the exact XML structure shown. If a piece of information is not found, write the value as: [not listed — fill in manually]

Output this structure and nothing else:

<business_name>[business name]</business_name>
<phone>[phone number]</phone>
<email>[email address]</email>
<address>[full address]</address>
<license>[license numbers and certifications]</license>
<services>
- [service 1]
- [service 2]
- [add as many as found]
</services>
<service_area>[cities, zip codes, or region served]</service_area>
<hours>[business hours, including any 24/7 emergency availability]</hours>
<pricing>[free quotes, price ranges, or specific prices]</pricing>
<credentials>[BBB, Google rating, awards, affiliations]</credentials>
<notes>[anything else a receptionist should know — emergency availability, what info to collect from callers, special policies]</notes>

Website content:
${plainText}`,
        },
      ],
    })

    const knowledge_base = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('')
      .trim()

    return NextResponse.json({ knowledge_base })
  } catch (error) {
    console.error('Knowledge base generation error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
