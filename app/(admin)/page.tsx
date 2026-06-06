'use client'

import { useState } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import { AccountsTable } from '@/components/dashboard/accounts-table'

type Filter = 'all' | 'live' | 'poc'

const TABS: { key: Filter; label: string; count: number }[] = [
  { key: 'all', label: 'All', count: 3 },
  { key: 'live', label: 'Live', count: 2 },
  { key: 'poc', label: 'POC', count: 1 },
]

export default function AdminPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>('all')

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
        <StatCard label="Total accounts" value="3" />
        <StatCard label="Live" value="2" delta="● active" deltaPositive />
        <StatCard label="In POC" value="1" />
        <StatCard label="Leads this week" value="12" delta="+18%" deltaPositive />
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
              {/* Count chip */}
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
