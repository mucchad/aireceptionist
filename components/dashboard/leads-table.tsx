'use client'

// Leads table — shown on the owner dashboard
// Displays each lead with customer info, job description, channel, time, and status

import { useState, useRef, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import type { Lead, LeadStatus } from '@/types'

const SWIPE_THRESHOLD = 0.38 // 38% of row width triggers confirm

function SwipeableLeadRow({
  canSwipe,
  onContacted,
  children,
  style,
  className,
}: {
  canSwipe: boolean
  onContacted: () => void
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) {
  const [dismissed, setDismissed] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const cbRef = useRef(onContacted)
  useEffect(() => { cbRef.current = onContacted }, [onContacted])

  useEffect(() => {
    const wrap = wrapRef.current
    const slide = slideRef.current
    const bg = bgRef.current
    if (!wrap || !slide || !bg) return
    const wEl = wrap, sEl = slide, bEl = bg

    let x0 = 0, y0 = 0, dx = 0
    let decided = false, isH = false

    function start(e: TouchEvent) {
      x0 = e.touches[0].clientX
      y0 = e.touches[0].clientY
      dx = 0; decided = false; isH = false
      sEl.style.transition = 'none'
    }

    function move(e: TouchEvent) {
      const x = e.touches[0].clientX
      const y = e.touches[0].clientY
      if (!decided) {
        if (Math.abs(x - x0) < 3 && Math.abs(y - y0) < 3) return
        isH = Math.abs(x - x0) > Math.abs(y - y0)
        decided = true
      }
      if (!isH) return
      e.preventDefault()
      dx = Math.max(0, x0 - x)
      sEl.style.transform = `translateX(-${dx}px)`
      bEl.style.opacity = String(Math.min(dx / 80, 1))
    }

    function end() {
      if (!isH) return
      const w = wEl.offsetWidth || 320
      if (dx >= w * SWIPE_THRESHOLD) {
        sEl.style.transition = 'transform 0.22s ease'
        sEl.style.transform = `translateX(-${w}px)`
        setTimeout(() => { setDismissed(true); cbRef.current() }, 230)
      } else {
        sEl.style.transition = 'transform 0.25s ease'
        sEl.style.transform = 'translateX(0)'
        bEl.style.opacity = '0'
      }
    }

    wEl.addEventListener('touchstart', start, { passive: true })
    wEl.addEventListener('touchmove', move, { passive: false })
    wEl.addEventListener('touchend', end, { passive: true })
    return () => {
      wEl.removeEventListener('touchstart', start)
      wEl.removeEventListener('touchmove', move)
      wEl.removeEventListener('touchend', end)
    }
  }, [])

  if (dismissed) return null

  return (
    <div ref={wrapRef} style={{ position: 'relative', overflow: 'hidden', ...style }} className={className}>
      <div ref={bgRef} style={{
        position: 'absolute', inset: 0, opacity: 0,
        backgroundColor: 'var(--color-live)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 24,
      }}>
        <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff' }}>
          ✓ Contacted
        </span>
      </div>
      <div ref={slideRef} style={{ backgroundColor: 'var(--color-surface)' }}>
        {children}
      </div>
    </div>
  )
}

const STATUS_CYCLE: Record<LeadStatus, LeadStatus | null> = {
  new: 'contacted',
  contacted: 'resolved',
  resolved: null, // terminal — no further cycling
}

const STATUS_STYLES: Record<LeadStatus, { color: string; bg: string; label: string }> = {
  new:       { color: 'var(--color-accent-text)',  bg: 'var(--color-accent-weak)',     label: 'New' },
  contacted: { color: 'var(--color-amber)',         bg: 'var(--color-amber-weak)',      label: 'Contacted' },
  resolved:  { color: 'var(--color-text-muted)',   bg: 'var(--color-surface-sunken)',  label: 'Resolved' },
}

function StatusSelector({
  leadId,
  initial,
  onStatusChange,
}: {
  leadId: string
  initial: LeadStatus
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void
}) {
  const [status, setStatus] = useState<LeadStatus>(initial)
  const [saving, setSaving] = useState(false)

  const next = STATUS_CYCLE[status]
  const styles = STATUS_STYLES[status]

  async function advance() {
    if (!next || saving) return
    setSaving(true)
    try {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, status: next }),
      })
      setStatus(next)
      onStatusChange?.(leadId, next)
    } catch {
      // silently fail — UI stays in sync, will correct on next reload
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      onClick={advance}
      disabled={!next || saving}
      title={next ? `Mark as ${next}` : 'Resolved'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: "'Hanken Grotesk', sans-serif",
        fontSize: 11.5,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 'var(--radius-pill)',
        color: styles.color,
        backgroundColor: styles.bg,
        border: 'none',
        cursor: next ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        opacity: saving ? 0.6 : 1,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          flexShrink: 0,
        }}
      />
      {styles.label}
      {next && (
        <span style={{ fontSize: 9, color: 'var(--color-text-muted)', marginLeft: 2 }}>▾</span>
      )}
    </button>
  )
}

function ChannelChip({ channel }: { channel: 'call' | 'sms' }) {
  const isCall = channel === 'call'
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontFamily: "'Hanken Grotesk', sans-serif",
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--color-text-secondary)',
      }}
    >
      <span
        style={{
          width: isCall ? 8 : 9,
          height: isCall ? 8 : 9,
          borderRadius: '50%',
          backgroundColor: isCall ? 'var(--color-accent)' : 'transparent',
          border: isCall ? 'none' : '2px solid var(--color-text-muted)',
          flexShrink: 0,
        }}
      />
      {isCall ? 'Call' : 'Text'}
    </div>
  )
}

function formatWhen(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface LeadsTableProps {
  leads: Lead[]
  filter: 'all' | LeadStatus
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void
}

export function LeadsTable({ leads, filter, onStatusChange }: LeadsTableProps) {
  const filtered = leads.filter((l) => filter === 'all' || l.status === filter)

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      {/* Table header — hidden on mobile */}
      <div className="leads-table-header">
        {['Customer', 'What they need', 'Channel', 'When', 'Status'].map((col) => (
          <span
            key={col}
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            {col}
          </span>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            fontFamily: "'Hanken Grotesk', sans-serif",
            color: 'var(--color-text-muted)',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>
            No leads yet
          </div>
          <div style={{ fontSize: 13 }}>
            When Alex captures a new lead it will show up here instantly.
          </div>
        </div>
      )}

      {/* Rows */}
      {filtered.map((lead, index) => (
        <SwipeableLeadRow
          key={lead.id}
          canSwipe={lead.status === 'new'}
          onContacted={async () => {
            await fetch('/api/leads', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lead_id: lead.id, status: 'contacted' }),
            })
            onStatusChange?.(lead.id, 'contacted')
          }}
          className="lead-row-enter"
          style={{
            borderBottom:
              index < filtered.length - 1 ? '1px solid var(--color-border-soft)' : 'none',
          }}
        >
        <div
          className="leads-table-row"
        >
          {/* Customer: avatar + name + phone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={lead.customer_name || lead.customer_phone} />
            <div>
              <div
                style={{
                  fontFamily: "'Hanken Grotesk', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}
              >
                {lead.customer_name || 'Unknown'}
              </div>
              <div
                style={{
                  fontFamily: "'Hanken Grotesk', sans-serif",
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  marginTop: 1,
                }}
              >
                {lead.customer_phone ? (
                  <a
                    href={`tel:${lead.customer_phone}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent-text)'; e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; e.currentTarget.style.textDecoration = 'none' }}
                  >
                    {lead.customer_phone}
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {/* Job description */}
          <div
            className="leads-col-job"
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              paddingRight: 16,
            }}
          >
            {lead.job_description || '—'}
          </div>

          {/* Channel chip — hidden on mobile, shown in card meta */}
          <div className="leads-col-channel">
            <ChannelChip channel={lead.channel} />
          </div>

          {/* When — hidden on mobile, shown in card meta */}
          <div
            className="leads-col-when"
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 13,
              color: 'var(--color-text-muted)',
            }}
          >
            {formatWhen(lead.created_at)}
          </div>

          {/* Status selector */}
          <div>
            <StatusSelector leadId={lead.id} initial={lead.status} onStatusChange={onStatusChange} />
          </div>

          {/* Mobile-only meta row: channel + time + status together */}
          <div className="leads-card-meta">
            <ChannelChip channel={lead.channel} />
            <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12, color: 'var(--color-text-muted)' }}>
              {formatWhen(lead.created_at)}
            </span>
          </div>
        </div>
        </SwipeableLeadRow>
      ))}
    </div>
  )
}
