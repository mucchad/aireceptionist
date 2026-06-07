'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { OwnerTopBar } from '@/components/ui/owner-top-bar'
import { StatCard } from '@/components/ui/stat-card'
import { LeadsTable } from '@/components/dashboard/leads-table'
import type { Lead, LeadStatus } from '@/types'

type Filter = 'all' | LeadStatus

const TABS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'new',       label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'resolved',  label: 'Resolved' },
]

interface DashboardData {
  accountName: string
  leads: Lead[]
  counts: {
    today: number
    thisWeek: number
    byStatus: Record<LeadStatus, number>
  }
  conversations: {
    total: number
    calls: number
    sms: number
  }
}

export default function OwnerDashboardPage() {
  const params = useParams()
  const token = params?.token as string

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeFilter, setActiveFilter] = useState<Filter>('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/dashboard/${token}`)
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) throw new Error('Failed to load')
        const json = await res.json()
        setData(json)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()

    // Poll for new leads every 15 seconds — keeps the dashboard live
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [token])

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg)',
          fontFamily: "'Hanken Grotesk', sans-serif",
          color: 'var(--color-text-muted)',
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────
  if (notFound || !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg)',
          fontFamily: "'Hanken Grotesk', sans-serif",
          textAlign: 'center',
          padding: 32,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: '0 0 8px',
          }}
        >
          Dashboard not found
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
          This link may have expired or is incorrect. Contact your Switchboard rep.
        </p>
      </div>
    )
  }

  const tabCounts: Record<Filter, number> = {
    all:       data.leads.length,
    new:       data.counts.byStatus.new,
    contacted: data.counts.byStatus.contacted,
    resolved:  data.counts.byStatus.resolved,
  }

  // ── Dashboard ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <OwnerTopBar businessName={data.accountName} />

      <div className="owner-dashboard-body">

        {/* Page header */}
        <div style={{ marginBottom: 18 }}>
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
            Here's who reached out
          </h1>
          <p
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 14,
              color: 'var(--color-text-muted)',
              margin: 0,
            }}
          >
            New messages land here the moment a call or text comes in.
          </p>
        </div>

        {/* Stat grid — 4 cards, 2x2 on mobile */}
        <div className="owner-stat-grid">
          <StatCard
            label="New today"
            value={String(data.counts.today)}
            delta={data.counts.today > 0 ? `● ${data.counts.today} just in` : undefined}
            deltaPositive
          />
          <StatCard
            label="This week"
            value={String(data.counts.thisWeek)}
          />
          <StatCard
            label="Total conversations"
            value={String(data.conversations?.total ?? 0)}
            delta={
              (data.conversations?.total ?? 0) > 0
                ? `📞 ${data.conversations?.calls ?? 0} calls · 💬 ${data.conversations?.sms ?? 0} texts`
                : undefined
            }
          />
          <StatCard
            label="Avg. first response"
            value="< 1s"
            delta="by Switchboard"
          />
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 16,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeFilter === tab.key
            const count = tabCounts[tab.key]
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
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Leads table */}
        <LeadsTable leads={data.leads} filter={activeFilter} />
      </div>
    </div>
  )
}
