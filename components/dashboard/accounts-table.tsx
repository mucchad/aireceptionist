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

interface ConvoCount { total: number; calls: number; sms: number }

export function AccountsTable({ filter }: AccountsTableProps) {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({})
  const [convoCounts, setConvoCounts] = useState<Record<string, ConvoCount>>({})
  const [ownerPhones, setOwnerPhones] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/accounts')
        const json = await res.json()
        setAccounts(json.accounts ?? [])
        setConvoCounts(json.convoCounts ?? {})
        setOwnerPhones(json.ownerPhones ?? {})

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

  async function deleteAccount(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/accounts/${id}/delete`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Delete failed')
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      // Clear Next.js router cache so Deleted page fetches fresh data on next visit
      router.refresh()
    } catch {
      alert('Failed to delete account. Please try again.')
    } finally {
      setDeleting(false)
      setConfirmDeleteId(null)
    }
  }

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
          gridTemplateColumns: 'minmax(0,1.7fr) 120px 160px 130px 80px 100px 64px 40px',
          alignItems: 'center',
          height: 42,
          padding: '0 20px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {['Business', 'Status', 'Phone number', 'Created', 'Leads', 'Conversations', '', ''].map((col) => (
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

      {/* Confirm delete dialog */}
      {confirmDeleteId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
              padding: '28px 32px',
              width: 380,
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
              Delete this account?
            </h3>
            <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
              The account will be hidden from the list. All data is kept — you can reactivate it later.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  fontFamily: "'Hanken Grotesk', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAccount(confirmDeleteId)}
                disabled={deleting}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: 'var(--color-accent)',
                  border: 'none',
                  fontFamily: "'Hanken Grotesk', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-on-accent)',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rows */}
      {filtered.map((account, index) => (
        <div
          key={account.id}
          onClick={() => router.push(`/accounts/${account.id}/edit`)}
          title="Edit account"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.7fr) 120px 160px 130px 80px 100px 64px 40px',
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

          {/* Phone numbers — business line + AI (Twilio) line */}
          <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 13 }}>
            {ownerPhones[account.id] ? (
              <div style={{ color: 'var(--color-text-secondary)' }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginRight: 4 }}>Biz</span>
                {ownerPhones[account.id].replace(/^\+?1?(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3')}
              </div>
            ) : null}
            {account.twilio_phone_number ? (
              <div style={{ color: 'var(--color-text-secondary)', marginTop: ownerPhones[account.id] ? 3 : 0 }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginRight: 4 }}>AI</span>
                {account.twilio_phone_number.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3')}
              </div>
            ) : (
              !ownerPhones[account.id] && <span style={{ color: 'var(--color-text-muted)' }}>—</span>
            )}
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

          {/* Conversation count */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span
              style={{
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              {convoCounts[account.id]?.total ?? 0}
            </span>
            {(convoCounts[account.id]?.total ?? 0) > 0 && (
              <span
                style={{
                  fontFamily: "'Hanken Grotesk', sans-serif",
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                }}
              >
                📞{convoCounts[account.id]?.calls ?? 0} · 💬{convoCounts[account.id]?.sms ?? 0}
              </span>
            )}
          </div>

          {/* View leads — opens owner dashboard in new tab */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(`/dashboard/${account.dashboard_token}`, '_blank')
              }}
              title="View leads dashboard"
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
              Leads ↗
            </button>
          </div>

          {/* Delete */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirmDeleteId(account.id)
              }}
              title="Delete account"
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-accent-weak)'
                e.currentTarget.style.borderColor = 'var(--color-accent)'
                e.currentTarget.style.color = 'var(--color-accent-text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.color = 'var(--color-text-muted)'
              }}
            >
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
