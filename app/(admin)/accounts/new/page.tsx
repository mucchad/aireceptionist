'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Source {
  type: 'website' | 'google_maps' | 'facebook' | 'yelp' | 'manual'
  url?: string
  content: string
}

interface FormData {
  name: string
  type: string
  persona_name: string
  twilio_phone_number: string
  website_url: string
  google_maps_url: string
  facebook_url: string
  yelp_url: string
  manual_content: string
  contact_name: string
  contact_phone: string
  contact_email: string
}

const KB_TEMPLATE = `## About This Business
[Brief description of what the business does]

## Services
-
-
-

## Service Area
[Cities, zip codes, or radius]

## Hours
Monday – Friday:
Saturday:
Sunday:

## FAQs
Q:
A:

Q:
A: `

const INITIAL_FORM: FormData = {
  name: '',
  type: '',
  persona_name: 'Alex',
  twilio_phone_number: '',
  website_url: '',
  google_maps_url: '',
  facebook_url: '',
  yelp_url: '',
  manual_content: KB_TEMPLATE,
  contact_name: '',
  contact_phone: '',
  contact_email: '',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  backgroundColor: 'var(--color-surface-sunken)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-control)',
  padding: '0 14px',
  fontFamily: "'Hanken Grotesk', sans-serif",
  fontSize: 14,
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Hanken Grotesk', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: 6,
}

const hintStyle: React.CSSProperties = {
  fontFamily: "'Hanken Grotesk', sans-serif",
  fontSize: 12,
  color: 'var(--color-text-muted)',
  marginTop: 4,
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={hintStyle}>{hint}</p>}
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
      <h2
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: '0 0 3px',
        }}
      >
        {title}
      </h2>
      <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
        {subtitle}
      </p>
    </div>
  )
}

export default function NewAccountPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ id: string; dashboard_token: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  async function generateKnowledgeBase() {
    if (!form.website_url.trim()) return
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await fetch('/api/accounts/generate-knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_url: form.website_url.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      update('manual_content', json.knowledge_base)
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function submit() {
    if (!form.name.trim()) { setError('Account name is required'); return }
    if (!form.type.trim()) { setError('Business type is required'); return }
    if (!form.contact_name.trim()) { setError('Contact name is required'); return }
    if (!form.contact_phone.trim()) { setError('Contact phone is required'); return }

    const hasSources =
      form.website_url.trim() ||
      form.google_maps_url.trim() ||
      form.facebook_url.trim() ||
      form.yelp_url.trim() ||
      form.manual_content.trim()
    if (!hasSources) { setError('Add at least one knowledge base source'); return }

    setError('')
    setLoading(true)

    const sources: Source[] = []
    if (form.website_url.trim())
      sources.push({ type: 'website', url: form.website_url.trim(), content: form.website_url.trim() })
    if (form.google_maps_url.trim())
      sources.push({ type: 'google_maps', url: form.google_maps_url.trim(), content: form.google_maps_url.trim() })
    if (form.facebook_url.trim())
      sources.push({ type: 'facebook', url: form.facebook_url.trim(), content: form.facebook_url.trim() })
    if (form.yelp_url.trim())
      sources.push({ type: 'yelp', url: form.yelp_url.trim(), content: form.yelp_url.trim() })
    if (form.manual_content.trim())
      sources.push({ type: 'manual', content: form.manual_content.trim() })

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          persona_name: form.persona_name,
          twilio_phone_number: form.twilio_phone_number || undefined,
          emergency_protocol: 'capture-and-notify',
          sources,
          contact_name: form.contact_name,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setCreated({
        id: json.account.id,
        dashboard_token: json.account.dashboard_token,
        name: json.account.name,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function copyDashboardLink() {
    if (!created) return
    const url = `${window.location.origin}/dashboard/${created.dashboard_token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Success screen ──────────────────────────────────────────
  if (created) {
    const dashboardUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/${created.dashboard_token}`
    return (
      <div style={{ padding: '26px 28px 28px', maxWidth: 560 }}>
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
            padding: '36px 32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-live-weak)',
              color: 'var(--color-live)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              margin: '0 auto 20px',
            }}
          >
            ✓
          </div>

          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--color-text)',
              margin: '0 0 8px',
            }}
          >
            {created.name} is ready
          </h2>
          <p
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 14,
              color: 'var(--color-text-muted)',
              margin: '0 0 28px',
            }}
          >
            Share this private link with the business owner so they can see their leads.
          </p>

          <div
            style={{
              backgroundColor: 'var(--color-surface-sunken)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-control)',
              padding: '12px 16px',
              marginBottom: 16,
              textAlign: 'left',
              wordBreak: 'break-all',
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 13,
              color: 'var(--color-text-secondary)',
            }}
          >
            {dashboardUrl}
          </div>

          <button
            onClick={copyDashboardLink}
            style={{
              width: '100%',
              height: 42,
              borderRadius: 'var(--radius-control)',
              backgroundColor: copied ? 'var(--color-live)' : 'var(--color-accent)',
              color: 'var(--color-on-accent)',
              boxShadow: 'var(--shadow-accent)',
              border: 'none',
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 12,
              transition: 'background-color 0.15s ease',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy dashboard link'}
          </button>

          <button
            onClick={() => { window.location.href = '/' }}
            style={{
              width: '100%',
              height: 42,
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'transparent',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Back to accounts
          </button>
        </div>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────
  return (
    <div style={{ padding: '26px 28px 60px' }}>
      {/* Back + header */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: 13,
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '0 0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Back to accounts
        </button>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: 'var(--color-text)',
            margin: '0 0 4px',
          }}
        >
          Add account
        </h1>
        <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
          Set up a new business on AI Switchboard
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '28px 32px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px 48px',
        }}
      >
        {/* ── Left column: Business basics + Primary contact ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          <div>
            <SectionHeader title="Business basics" subtitle="Core details about this client" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Account name *">
                <input
                  style={inputStyle}
                  placeholder="e.g. Riverside Fence Co"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </Field>

              <Field label="Business type *">
                <input
                  style={inputStyle}
                  placeholder="e.g. Fence installation, Plumbing, HVAC"
                  value={form.type}
                  onChange={(e) => update('type', e.target.value)}
                />
              </Field>

              <Field label="AI persona name" hint="The name Alex uses when answering calls and texts">
                <input
                  style={inputStyle}
                  placeholder="Alex"
                  value={form.persona_name}
                  onChange={(e) => update('persona_name', e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div>
            <SectionHeader title="Primary contact" subtitle="Who gets notified when a new lead comes in" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Contact name *">
                <input
                  style={inputStyle}
                  placeholder="e.g. Mike Johnson"
                  value={form.contact_name}
                  onChange={(e) => update('contact_name', e.target.value)}
                />
              </Field>

              <Field label="Mobile phone *" hint="Gets a text every time Alex captures a new lead">
                <input
                  style={inputStyle}
                  placeholder="+1 (555) 000-0000"
                  value={form.contact_phone}
                  onChange={(e) => update('contact_phone', e.target.value)}
                />
              </Field>

              <Field label="Email address" hint="Optional — for future email notifications">
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="mike@example.com"
                  value={form.contact_email}
                  onChange={(e) => update('contact_email', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Right column: Phone + Knowledge base ── */}
        <div>
          {/* Twilio phone number */}
          <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid var(--color-border)' }}>
            <SectionHeader title="Twilio Phone Number" subtitle="The Twilio number assigned to this account" />
            <Field label="Twilio number" hint="Format: +14085551234 — buy the number in Twilio, paste it here">
              <input
                style={inputStyle}
                placeholder="+1 (408) 555-1234"
                value={form.twilio_phone_number}
                onChange={(e) => update('twilio_phone_number', e.target.value)}
              />
            </Field>
          </div>

          <SectionHeader title="Knowledge base" subtitle="What Alex knows about this business" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Website URL" hint="Paste the business website — then click Generate to build the knowledge base">
              <input
                style={inputStyle}
                placeholder="https://www.example.com"
                value={form.website_url}
                onChange={(e) => update('website_url', e.target.value)}
              />
              <button
                type="button"
                onClick={generateKnowledgeBase}
                disabled={!form.website_url.trim() || generating}
                style={{
                  marginTop: 8,
                  padding: '7px 16px',
                  fontFamily: "'Hanken Grotesk', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-control)',
                  border: 'none',
                  cursor: !form.website_url.trim() || generating ? 'not-allowed' : 'pointer',
                  backgroundColor: !form.website_url.trim() || generating ? 'var(--color-surface-sunken)' : 'var(--color-accent)',
                  color: !form.website_url.trim() || generating ? 'var(--color-text-muted)' : '#fff',
                  transition: 'background-color 0.15s',
                }}
              >
                {generating ? '⏳ Generating…' : '✦ Generate knowledge base'}
              </button>
              {generateError && (
                <p style={{ ...hintStyle, color: 'var(--color-accent-text)', marginTop: 6 }}>{generateError}</p>
              )}
            </Field>

            <Field label="Google Maps URL">
              <input
                style={inputStyle}
                placeholder="https://maps.google.com/..."
                value={form.google_maps_url}
                onChange={(e) => update('google_maps_url', e.target.value)}
              />
            </Field>

            <Field label="Facebook page URL">
              <input
                style={inputStyle}
                placeholder="https://www.facebook.com/..."
                value={form.facebook_url}
                onChange={(e) => update('facebook_url', e.target.value)}
              />
            </Field>

            <Field label="Yelp listing URL">
              <input
                style={inputStyle}
                placeholder="https://www.yelp.com/biz/..."
                value={form.yelp_url}
                onChange={(e) => update('yelp_url', e.target.value)}
              />
            </Field>

            <Field label="Manual write-up" hint="Fill in what Alex should know about this business">
              <textarea
                style={{
                  ...inputStyle,
                  height: 340,
                  padding: '10px 14px',
                  resize: 'vertical',
                  lineHeight: 1.6,
                  fontFamily: 'monospace',
                  fontSize: 13,
                }}
                value={form.manual_content}
                onChange={(e) => update('manual_content', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Error — spans both columns */}
        {error && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '10px 14px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--color-accent-weak)',
              border: '1px solid var(--color-accent)',
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 13,
              color: 'var(--color-accent-text)',
            }}
          >
            {error}
          </div>
        )}

        {/* Submit button — spans both columns */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              height: 42,
              padding: '0 28px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: loading ? 'var(--color-text-muted)' : 'var(--color-accent)',
              color: 'var(--color-on-accent)',
              boxShadow: loading ? 'none' : 'var(--shadow-accent)',
              border: 'none',
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <button
            onClick={() => { window.location.href = '/' }}
            style={{
              height: 42,
              padding: '0 20px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'transparent',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
