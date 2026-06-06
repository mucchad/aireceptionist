'use client'

// Leads table — shown on the owner dashboard
// Displays each lead with customer info, job description, channel, time, and status

import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import type { Lead, LeadStatus } from '@/types'

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
      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '210px minmax(0,1.7fr) 116px 116px 150px',
          alignItems: 'center',
          height: 42,
          padding: '0 20px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
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
        <div
          key={lead.id}
          className="lead-row-enter"
          style={{
            display: 'grid',
            gridTemplateColumns: '210px minmax(0,1.7fr) 116px 116px 150px',
            alignItems: 'center',
            minHeight: 64,
            padding: '10px 20px',
            borderBottom:
              index < filtered.length - 1 ? '1px solid var(--color-border-soft)' : 'none',
          }}
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
                {lead.customer_phone}
              </div>
            </div>
          </div>

          {/* Job description */}
          <div
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

          {/* Channel chip */}
          <div>
            <ChannelChip channel={lead.channel} />
          </div>

          {/* When */}
          <div
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
        </div>
      ))}
    </div>
  )
}
