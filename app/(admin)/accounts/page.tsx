'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StatCard } from '@/components/ui/stat-card'
import { AccountsTable } from '@/components/dashboard/accounts-table'
import type { Account } from '@/types'

type Filter = 'all' | 'live' | 'poc'

export default function AdminPage() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []))
      .catch(() => {})
  }, [])

  const total = accounts.length
  const live  = accounts.filter((a) => a.status === 'live').length
  const poc   = accounts.filter((a) => a.status === 'poc').length

  const TABS: { key: Filter; label: string; count: number }[] = [
    { key: 'all',  label: 'All',  count: total },
    { key: 'live', label: 'Live', count: live },
    { key: 'poc',  label: 'POC',  count: poc },
  ]

  return (
    <div style={{ padding: '26px 28px 28px' }}>

      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div>
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
            Accounts
          </h1>
          <p
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 14,
              color: 'var(--color-text-muted)',
              margin: '4px 0 0',
            }}
          >
            Manage your client accounts and their AI receptionists
          </p>
        </div>

        {/* New account button */}
        <button
          style={{
            height: 38,
            padding: '0 16px',
            borderRadius: 'var(--radius-control)',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-on-accent)',
            boxShadow: 'var(--shadow-accent)',
            border: 'none',
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: 13.5,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-accent)'
          }}
          onClick={() => router.push('/accounts/new')}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          New account
        </button>
      </div>

      {/* Stat grid — 4 cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <StatCard label="Total accounts" value={String(total)} />
        <StatCard label="Live" value={String(live)} delta={live > 0 ? '● active' : undefined} deltaPositive />
        <StatCard label="In POC" value={String(poc)} />
        <StatCard label="Leads this week" value="—" />
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 16,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 14px',
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: isActive
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                transition: 'color 0.1s ease',
              }}
            >
              {tab.label}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isActive
                    ? 'var(--color-accent-weak)'
                    : 'var(--color-surface-sunken)',
                  color: isActive
                    ? 'var(--color-accent-text)'
                    : 'var(--color-text-muted)',
                }}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Accounts table */}
      <AccountsTable filter={activeFilter} />
    </div>
  )
}
