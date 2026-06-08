// Admin logging page — shows all dashboard visits with account info, time, and device

import { getVisits } from '@/lib/db/visits'

function parseDevice(userAgent: string | null): string {
  if (!userAgent) return '—'
  const ua = userAgent.toLowerCase()
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'Mobile'
  if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet'
  return 'Desktop'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default async function LoggingPage() {
  const visits = await getVisits()

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: 'var(--color-text)',
            margin: '0 0 6px',
          }}
        >
          Dashboard Visits
        </h1>
        <p
          style={{
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          Every time a customer opens their dashboard link. {visits.length} total visits recorded.
        </p>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-sunken)',
              }}
            >
              {['Account', 'Account ID', 'Date / Time', 'Device'].map((col) => (
                <th
                  key={col}
                  style={{
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    padding: '10px 16px',
                    textAlign: 'left',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visits.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontSize: 14,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  No visits recorded yet. Send a dashboard link to a customer to start tracking.
                </td>
              </tr>
            ) : (
              visits.map((v, i) => (
                <tr
                  key={v.id}
                  style={{
                    borderBottom: i < visits.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  <td
                    style={{
                      padding: '12px 16px',
                      fontFamily: "'Hanken Grotesk', sans-serif",
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: 'var(--color-text)',
                    }}
                  >
                    {v.account_name}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontFamily: "'Hanken Grotesk', sans-serif",
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {v.account_id}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontFamily: "'Hanken Grotesk', sans-serif",
                      fontSize: 13,
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatDate(v.visited_at)}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontFamily: "'Hanken Grotesk', sans-serif",
                      fontSize: 13,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {parseDevice(v.user_agent)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
