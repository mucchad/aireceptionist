'use client'

// Deleted accounts page — /accounts/deleted
// Shows all soft-deleted accounts with restore and permanent-delete options

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Account } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DeletedAccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts/deleted')
      const json = await res.json()
      setAccounts(json.accounts ?? [])
    } catch {
      // silently fail — empty state shown
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRestore(id: string) {
    setRestoringId(id)
    try {
      const res = await fetch(`/api/accounts/${id}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Restore failed')
      // Optimistically remove from the deleted list
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      // Clear Next.js router cache so Accounts page shows restored account immediately
      router.refresh()
    } catch {
      alert('Failed to restore account. Please try again.')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div style={{ padding: '26px 28px 28px' }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: 'var(--color-text)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Deleted Accounts
        </h1>
        <p
          style={{
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-muted)',
            margin: '4px 0 0',
          }}
        >
          These accounts have been soft-deleted. You can restore them at any time.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14, color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      )}

      {/* Empty state */}
      {!loading && accounts.length === 0 && (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-card)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
          <p
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 14,
              color: 'var(--color-text-muted)',
              margin: 0,
            }}
          >
            No deleted accounts. When you delete an account, it will appear here.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && accounts.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 140px 120px',
              padding: '10px 20px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-sunken)',
            }}
          >
            {['Account', 'Type', 'Deleted on', ''].map((h) => (
              <span
                key={h}
                style={{
                  fontFamily: "'Hanken Grotesk', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {accounts.map((account) => (
            <div
              key={account.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 140px 120px',
                padding: '14px 20px',
                borderBottom: '1px solid var(--color-border)',
                alignItems: 'center',
              }}
            >
              {/* Name + persona */}
              <div>
                <div
                  style={{
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                  }}
                >
                  {account.name}
                </div>
                {account.persona_name && (
                  <div
                    style={{
                      fontFamily: "'Hanken Grotesk', sans-serif",
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                      marginTop: 2,
                    }}
                  >
                    AI persona: {account.persona_name}
                  </div>
                )}
              </div>

              {/* Type */}
              <span
                style={{
                  fontFamily: "'Hanken Grotesk', sans-serif",
                  fontSize: 13,
                  color: 'var(--color-text-muted)',
                }}
              >
                {account.type ?? '—'}
              </span>

              {/* Deleted on */}
              <span
                style={{
                  fontFamily: "'Hanken Grotesk', sans-serif",
                  fontSize: 13,
                  color: 'var(--color-text-muted)',
                }}
              >
                {account.deleted_at ? formatDate(account.deleted_at) : '—'}
              </span>

              {/* Restore button */}
              <div>
                <button
                  onClick={() => handleRestore(account.id)}
                  disabled={restoringId === account.id}
                  style={{
                    height: 32,
                    padding: '0 14px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: restoringId === account.id
                      ? 'var(--color-surface-sunken)'
                      : 'var(--color-surface)',
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: restoringId === account.id
                      ? 'var(--color-text-muted)'
                      : 'var(--color-text)',
                    cursor: restoringId === account.id ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (restoringId !== account.id) {
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (restoringId !== account.id) {
                      e.currentTarget.style.backgroundColor = 'var(--color-surface)'
                    }
                  }}
                >
                  {restoringId === account.id ? 'Restoring…' : '↩ Restore'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
