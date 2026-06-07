'use client'

// Edit Account page — pre-filled form to update business details, knowledge base, and contact
// Accessible from the admin accounts table via the Edit button

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

type EmergencyProtocol = 'capture-and-notify' | 'direct-number' | 'immediate-sms'

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

interface FormData {
  name: string
  type: string
  persona_name: string
  emergency_protocol: EmergencyProtocol
  emergency_contact: string
  website_url: string
  google_maps_url: string
  facebook_url: string
  yelp_url: string
  manual_content: string
  contact_name: string
  contact_phone: string
  contact_email: string
}

const EMERGENCY_OPTIONS: { value: EmergencyProtocol; label: string; description: string }[] = [
  {
    value: 'capture-and-notify',
    label: 'Capture and notify',
    description: 'Alex captures the info and says someone will call back within the hour',
  },
  {
    value: 'immediate-sms',
    label: 'Immediate SMS',
    description: 'Alex texts you immediately when an emergency comes in',
  },
  {
    value: 'direct-number',
    label: 'Give direct number',
    description: 'Alex gives the customer your direct phone number for emergencies',
  },
]

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

export default function EditAccountPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState<FormData>({
    name: '',
    type: '',
    persona_name: 'Alex',
    emergency_protocol: 'capture-and-notify',
    emergency_contact: '',
    website_url: '',
    google_maps_url: '',
    facebook_url: '',
    yelp_url: '',
    manual_content: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // Load existing data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/accounts/${id}`)
        if (!res.ok) throw new Error('Account not found')
        const json = await res.json()

        const { account, sources, contact } = json

        // Pull each source type back into form fields
        const website = sources.find((s: { type: string }) => s.type === 'website')
        const googleMaps = sources.find((s: { type: string }) => s.type === 'google_maps')
        const facebook = sources.find((s: { type: string }) => s.type === 'facebook')
        const yelp = sources.find((s: { type: string }) => s.type === 'yelp')
        const manual = sources.find((s: { type: string }) => s.type === 'manual')

        setForm({
          name: account.name ?? '',
          type: account.type ?? '',
          persona_name: account.persona_name ?? 'Alex',
          emergency_protocol: account.emergency_protocol ?? 'capture-and-notify',
          emergency_contact: account.emergency_contact ?? '',
          website_url: website?.url ?? '',
          google_maps_url: googleMaps?.url ?? '',
          facebook_url: facebook?.url ?? '',
          yelp_url: yelp?.url ?? '',
          manual_content: manual?.content ?? KB_TEMPLATE,
          contact_name: contact?.name ?? '',
          contact_phone: contact?.phone ?? '',
          contact_email: contact?.email ?? '',
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load account')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function save() {
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
    setSaving(true)

    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '26px 28px', fontFamily: "'Hanken Grotesk', sans-serif", color: 'var(--color-text-muted)' }}>
        Loading account…
      </div>
    )
  }

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
          Edit account
        </h1>
        <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
          {form.name || 'Loading…'}
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '28px 32px',
          maxWidth: 600,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        {/* ── Section 1: Business basics ── */}
        <div>
          <SectionHeader title="Business basics" subtitle="Core details about this client" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Account name *">
              <input
                style={inputStyle}
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
                value={form.persona_name}
                onChange={(e) => update('persona_name', e.target.value)}
              />
            </Field>

            <Field label="Emergency protocol">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {EMERGENCY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-control)',
                      border: `1px solid ${form.emergency_protocol === opt.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      backgroundColor: form.emergency_protocol === opt.value ? 'var(--color-accent-weak)' : 'var(--color-surface-sunken)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="emergency_protocol"
                      value={opt.value}
                      checked={form.emergency_protocol === opt.value}
                      onChange={() => update('emergency_protocol', opt.value)}
                      style={{ marginTop: 2, accentColor: 'var(--color-accent)' }}
                    />
                    <div>
                      <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {opt.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Field>

            {form.emergency_protocol === 'direct-number' && (
              <Field label="Emergency direct number *">
                <input
                  style={inputStyle}
                  placeholder="+1 (555) 000-0000"
                  value={form.emergency_contact}
                  onChange={(e) => update('emergency_contact', e.target.value)}
                />
              </Field>
            )}
          </div>
        </div>

        {/* ── Section 2: Knowledge base ── */}
        <div>
          <SectionHeader title="Knowledge base" subtitle="What Alex knows about this business" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Website URL" hint="We'll pull services, hours, and FAQs automatically">
              <input
                style={inputStyle}
                placeholder="https://www.example.com"
                value={form.website_url}
                onChange={(e) => update('website_url', e.target.value)}
              />
            </Field>

            <Field label="Google Maps URL" hint="We'll pull reviews, hours, and business details">
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

            <Field label="Manual write-up" hint="No website? Paste anything useful — services, prices, hours, FAQs">
              <textarea
                style={{
                  ...inputStyle,
                  height: 160,
                  padding: '10px 14px',
                  resize: 'vertical',
                  lineHeight: 1.6,
                }}
                value={form.manual_content}
                onChange={(e) => update('manual_content', e.target.value)}
                placeholder="e.g. We install wood, vinyl, and chain-link fences. Service area: San Jose, CA and surrounding areas within 30 miles. Hours: Mon–Fri 8am–6pm, Sat 9am–2pm..."
              />
            </Field>
          </div>
        </div>

        {/* ── Section 3: Primary contact ── */}
        <div>
          <SectionHeader title="Primary contact" subtitle="Who gets notified when a new lead comes in" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Contact name *">
              <input
                style={inputStyle}
                value={form.contact_name}
                onChange={(e) => update('contact_name', e.target.value)}
              />
            </Field>

            <Field label="Mobile phone *" hint="Gets a text message every time Alex captures a new lead">
              <input
                style={inputStyle}
                value={form.contact_phone}
                onChange={(e) => update('contact_phone', e.target.value)}
              />
            </Field>

            <Field label="Email address" hint="Optional — for future email notifications">
              <input
                style={inputStyle}
                type="email"
                value={form.contact_email}
                onChange={(e) => update('contact_email', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
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

        {/* Save button */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              height: 42,
              padding: '0 28px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: saved ? 'var(--color-live)' : saving ? 'var(--color-text-muted)' : 'var(--color-accent)',
              color: 'var(--color-on-accent)',
              boxShadow: saving ? 'none' : 'var(--shadow-accent)',
              border: 'none',
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
          </button>

          <button
            onClick={() => router.push('/')}
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
