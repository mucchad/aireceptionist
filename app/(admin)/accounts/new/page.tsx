'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Source {
  type: 'website' | 'google_maps' | 'facebook' | 'yelp' | 'manual'
  url?: string
  content: string
}

interface FormData {
  // Step 1
  name: string
  type: string
  persona_name: string
  // Step 2
  website_url: string
  google_maps_url: string
  facebook_url: string
  yelp_url: string
  manual_content: string
  // Step 3
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
  website_url: '',
  google_maps_url: '',
  facebook_url: '',
  yelp_url: '',
  manual_content: KB_TEMPLATE,
  contact_name: '',
  contact_phone: '',
  contact_email: '',
}

// Reusable input style
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

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={hintStyle}>{hint}</p>}
    </div>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-pill)',
              backgroundColor:
                i + 1 === current
                  ? 'var(--color-accent)'
                  : i + 1 < current
                  ? 'var(--color-live)'
                  : 'var(--color-surface-sunken)',
              color:
                i + 1 <= current ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {i + 1 < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div
              style={{
                width: 32,
                height: 1,
                backgroundColor:
                  i + 1 < current ? 'var(--color-live)' : 'var(--color-border)',
              }}
            />
          )}
        </div>
      ))}
      <span
        style={{
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontSize: 13,
          color: 'var(--color-text-muted)',
          marginLeft: 8,
        }}
      >
        Step {current} of {total}
      </span>
    </div>
  )
}

const STEP_TITLES = [
  { title: 'Business basics', subtitle: 'Tell us about this client' },
  { title: 'Knowledge base', subtitle: 'Where should Alex learn about this business?' },
  { title: 'Primary contact', subtitle: 'Who gets notified when a new lead comes in?' },
]

export default function NewAccountPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ id: string; dashboard_token: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validateStep(s: number): string {
    if (s === 1) {
      if (!form.name.trim()) return 'Account name is required'
      if (!form.type.trim()) return 'Business type is required'
    }
    if (s === 2) {
      const hasSources =
        form.website_url.trim() ||
        form.google_maps_url.trim() ||
        form.facebook_url.trim() ||
        form.yelp_url.trim() ||
        form.manual_content.trim()
      if (!hasSources) return 'Add at least one knowledge base source'
    }
    if (s === 3) {
      if (!form.contact_name.trim()) return 'Contact name is required'
      if (!form.contact_phone.trim()) return 'Contact phone is required for SMS notifications'
    }
    return ''
  }

  function next() {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    setStep((s) => s + 1)
  }

  function back() {
    setError('')
    setStep((s) => s - 1)
  }

  async function submit() {
    const err = validateStep(3)
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    // Build sources array from filled-in fields
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
          {/* Success icon */}
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

          {/* Dashboard link */}
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

          {/* Copy button */}
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

          {/* Back to accounts */}
          <button
            onClick={() => router.push('/')}
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
    <div style={{ padding: '26px 28px 28px' }}>

      {/* Page header */}
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
          {STEP_TITLES[step - 1].title}
        </h1>
        <p
          style={{
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          {STEP_TITLES[step - 1].subtitle}
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '28px 32px',
          maxWidth: 560,
        }}
      >
        <StepIndicator current={step} total={3} />

        {/* ── Step 1: Business basics ── */}
        {step === 1 && (
          <FieldGroup>
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

            <Field
              label="AI persona name"
              hint="This is the name Alex will use when answering calls and texts"
            >
              <input
                style={inputStyle}
                placeholder="Alex"
                value={form.persona_name}
                onChange={(e) => update('persona_name', e.target.value)}
              />
            </Field>

          </FieldGroup>
        )}

        {/* ── Step 2: Knowledge base ── */}
        {step === 2 && (
          <FieldGroup>
            <p
              style={{
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 13,
                color: 'var(--color-text-muted)',
                margin: '0 0 4px',
                lineHeight: 1.5,
              }}
            >
              Add at least one source. Alex will use all of them to answer customer questions accurately.
            </p>

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

            <Field
              label="Manual write-up"
              hint="No website? Paste anything useful — services, prices, hours, FAQs"
            >
              <textarea
                style={{
                  ...inputStyle,
                  height: 280,
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
          </FieldGroup>
        )}

        {/* ── Step 3: Primary contact ── */}
        {step === 3 && (
          <FieldGroup>
            <Field label="Contact name *">
              <input
                style={inputStyle}
                placeholder="e.g. Mike Johnson"
                value={form.contact_name}
                onChange={(e) => update('contact_name', e.target.value)}
              />
            </Field>

            <Field
              label="Mobile phone *"
              hint="This number gets a text message every time Alex captures a new lead"
            >
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
          </FieldGroup>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              marginTop: 20,
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

        {/* Navigation buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 28,
            gap: 12,
          }}
        >
          {step > 1 ? (
            <button
              onClick={back}
              style={{
                height: 38,
                padding: '0 20px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'transparent',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={next}
              style={{
                height: 38,
                padding: '0 24px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
                boxShadow: 'var(--shadow-accent)',
                border: 'none',
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading}
              style={{
                height: 38,
                padding: '0 24px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: loading ? 'var(--color-text-muted)' : 'var(--color-accent)',
                color: 'var(--color-on-accent)',
                boxShadow: loading ? 'none' : 'var(--shadow-accent)',
                border: 'none',
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
