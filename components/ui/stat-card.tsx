// Stat card — the metric tiles shown at the top of each page

interface StatCardProps {
  label: string       // e.g. "Total accounts"
  value: string       // e.g. "12"
  delta?: string      // e.g. "+18%" or "● 2 just in"
  deltaPositive?: boolean  // green if true, muted if false
}

export function StatCard({ label, value, delta, deltaPositive }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        {label}
      </span>

      {/* Value + delta */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--color-text)',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {delta && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: deltaPositive ? 'var(--color-live)' : 'var(--color-text-muted)',
            }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  )
}
