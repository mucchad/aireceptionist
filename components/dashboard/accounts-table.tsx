'use client'

// Accounts table — the main list of all accounts in the admin panel
// Fetches real data from Supabase, rows link to each account's owner dashboard

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Account } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface AccountsTableProps {
  filter: 'all' | 'live' | 'poc'
}

export function AccountsTable({ filter }: AccountsTableProps) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/accounts')
        const json = await res.json()
        setAccounts(json.accounts ?? [])

        // Fetch lead counts for each account
        const counts: Record<string, number> = {}
        await Promise.all(
          (json.accounts ?? []).map(async (account: Account) => {
            const r = await fetch(`/api/dashboard/${account.dashboard_token}`)
            if (r.ok) {
              const d = await r.json()
              counts[account.id] = d.counts?.total ?? 0
            }
          })
        )
        setLeadCounts(counts)
      } catch (e) {
        console.error('Failed to load accounts:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = accounts.filter((a) => {
    if (filter === 'all') return true
    return a.status === filter
  })

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '40px 20px',
          textAlign: 'center',
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontSize: 14,
          color: 'var(--color-text-muted)',
        }}
      >
        Loading accounts…
      </div>
    )
  }

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
          gridTemplateColumns: 'minmax(0,1.7fr) 120px 172px 150px 96px 64px',
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

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            fontFamily: "'Hanken Grotesk', sans-serif",
            color: 'var(--color-text-muted)',
            fontSize: 14,
          }}
        >
          {accounts.length === 0
            ? 'No accounts yet — click "+ New account" to add your first one.'
            : 'No accounts match this filter.'}
        </div>
      )}

      {/* Rows */}
      {filtered.map((account, index) => (
        <div
          key={account.id}
          onClick={() =>
            window.open(`/dashboard/${account.dashboard_token}`, '_blank')
          }
          title="Open owner dashboard"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.7fr) 120px 172px 150px 96px 64px',
            alignItems: 'center',
            height: 64,
            padding: '0 20px',
            borderBottom:
              index < filtered.length - 1
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
            {leadCounts[account.id] ?? 0}
          </div>

          {/* Edit button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => {
                // Stop the row click from opening the owner dashboard
                e.stopPropagation()
                router.push(`/accounts/${account.id}/edit`)
              }}
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--color-surface-sunken)',
                border: '1px solid var(--color-border)',
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
