// Accounts table — the main list of all accounts in the admin panel
// Shows avatar, name, type, status, phone, created date, lead count

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Account } from '@/types'

// Sample data so the screen looks real before we wire up the database
const SAMPLE_ACCOUNTS: Account[] = [
  {
    id: '1',
    name: 'Riverside Fence Co',
    type: 'Fence installation',
    status: 'poc',
    twilio_phone_number: '+1 (555) 201-4821',
    dashboard_token: 'abc123',
    persona_name: 'Alex',
    emergency_protocol: 'capture-and-notify',
    notify_sms: true,
    created_at: '2026-04-02T10:00:00Z',
    updated_at: '2026-04-02T10:00:00Z',
  },
  {
    id: '2',
    name: 'Blue Sky Plumbing',
    type: 'Plumbing',
    status: 'live',
    twilio_phone_number: '+1 (555) 384-9203',
    dashboard_token: 'def456',
    persona_name: 'Alex',
    emergency_protocol: 'immediate-sms',
    notify_sms: true,
    created_at: '2026-03-15T10:00:00Z',
    updated_at: '2026-03-15T10:00:00Z',
  },
  {
    id: '3',
    name: 'Arctic Air HVAC',
    type: 'HVAC',
    status: 'live',
    twilio_phone_number: '+1 (555) 102-7764',
    dashboard_token: 'ghi789',
    persona_name: 'Alex',
    emergency_protocol: 'direct-number',
    notify_sms: true,
    created_at: '2026-02-28T10:00:00Z',
    updated_at: '2026-02-28T10:00:00Z',
  },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const LEAD_COUNTS: Record<string, number> = {
  '1': 4,
  '2': 31,
  '3': 18,
}

interface AccountsTableProps {
  filter: 'all' | 'live' | 'poc'
}

export function AccountsTable({ filter }: AccountsTableProps) {
  const filtered = SAMPLE_ACCOUNTS.filter((a) => {
    if (filter === 'all') return true
    return a.status === filter
  })

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
          gridTemplateColumns: 'minmax(0,1.7fr) 120px 172px 150px 96px 22px',
          alignItems: 'center',
          height: 42,
          padding: '0 20px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {['Business', 'Status', 'Phone number', 'Created', 'Leads', ''].map((col) => (
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

      {/* Rows */}
      {filtered.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: 14,
          }}
        >
          No accounts yet.
        </div>
      ) : (
        filtered.map((account, index) => (
          <div
            key={account.id}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1.7fr) 120px 172px 150px 96px 22px',
              alignItems: 'center',
              height: 64,
              padding: '0 20px',
              borderBottom: index < filtered.length - 1
                ? '1px solid var(--color-border-soft)'
                : 'none',
              cursor: 'pointer',
              transition: 'background-color 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-row-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {/* Business: avatar + name + type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <Avatar name={account.name} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {account.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    marginTop: 1,
                  }}
                >
                  {account.type}
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div>
              <Badge variant={account.status} />
            </div>

            {/* Phone number */}
            <div
              style={{
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 13,
                color: 'var(--color-text-secondary)',
              }}
            >
              {account.twilio_phone_number ?? '—'}
            </div>

            {/* Created date */}
            <div
              style={{
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 13,
                color: 'var(--color-text-secondary)',
              }}
            >
              {formatDate(account.created_at)}
            </div>

            {/* Lead count */}
            <div
              style={{
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              {LEAD_COUNTS[account.id] ?? 0}
            </div>

            {/* Chevron */}
            <div
              style={{
                color: 'var(--color-text-muted)',
                fontSize: 15,
                textAlign: 'right',
              }}
            >
              ›
            </div>
          </div>
        ))
      )}
    </div>
  )
}
