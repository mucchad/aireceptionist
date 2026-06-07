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
  const [offset, setOffset] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const dragging = useRef(false)
  const currentOffset = useRef(0)

  useEffect(() => {
    const inner = innerRef.current
    if (!inner || !canSwipe) return

    function onTouchStart(e: TouchEvent) {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      dragging.current = false
    }

    function onTouchMove(e: TouchEvent) {
      const dx = startX.current - e.touches[0].clientX
      const dy = Math.abs(startY.current - e.touches[0].clientY)

      // Only take over if clearly horizontal
      if (!dragging.current && Math.abs(dx) < 6) return
      if (!dragging.current && dy > Math.abs(dx)) return

      dragging.current = true
      e.preventDefault()

      const clamped = Math.max(0, Math.min(dx, window.innerWidth * 0.75))
      currentOffset.current = clamped
      if (inner) {
        inner.style.transition = 'none'
        inner.style.transform = `translateX(-${clamped}px)`
      }
      setOffset(clamped)
    }

    function onTouchEnd() {
      if (!dragging.current) return
      dragging.current = false
      const width = outerRef.current?.offsetWidth ?? window.innerWidth
      if (currentOffset.current >= width * SWIPE_THRESHOLD) {
        setTransitioning(true)
        if (inner) {
          inner.style.transition = 'transform 0.25s ease'
          inner.style.transform = `translateX(-${width}px)`
        }
        setTimeout(() => {
          setDismissed(true)
          onContacted()
        }, 260)
      } else {
        if (inner) {
          inner.style.transition = 'transform 0.3s ease'
          inner.style.transform = 'translateX(0)'
        }
        setOffset(0)
      }
    }

    inner.addEventListener('touchstart', onTouchStart, { passive: true })
    inner.addEventListener('touchmove', onTouchMove, { passive: false })
    inner.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      inner.removeEventListener('touchstart', onTouchStart)
      inner.removeEventListener('touchmove', onTouchMove)
      inner.removeEventListener('touchend', onTouchEnd)
    }
  }, [canSwipe, onContacted])

  if (dismissed) return null

  return (
    <div
      ref={outerRef}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      className={className}
    >
      {/* Green action background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'var(--color-live)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 24,
          opacity: canSwipe ? Math.min(offset / 60, 1) : 0,
        }}
      >
        <span style={{
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.02em',
        }}>
          ✓ Contacted
        </span>
      </div>

      {/* Row content — slides left */}
      <div
        ref={innerRef}
        style={{
          backgroundColor: 'var(--color-surface)',
          willChange: 'transform',
        }}
      >
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
}: {
  leadId: string
  initial: LeadStatus
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
}

async function markContacted(leadId: string) {
  await fetch('/api/leads', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_id: leadId, status: 'contacted' }),
  })
}

export function LeadsTable({ leads, filter }: LeadsTableProps) {
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
          onContacted={() => markContacted(lead.id)}
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
            <StatusSelector leadId={lead.id} initial={lead.status} />
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
