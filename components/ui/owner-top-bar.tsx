// Top bar for the owner dashboard — shows the business name, Live pill, Export button
// This is NOT the admin top bar — it's what the client sees on their secret link

interface OwnerTopBarProps {
  businessName: string
}

export function OwnerTopBar({ businessName }: OwnerTopBarProps) {
  // Generate initials from business name for the logo mark
  const initials = businessName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header
      className="owner-topbar"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        gap: 18,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Business brand lockup */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 'var(--radius-logo)',
            backgroundColor: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-on-accent)',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <span
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          {businessName}
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Live pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 11px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'var(--color-live-weak)',
          color: 'var(--color-live)',
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <span
          className="live-dot"
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: 'var(--color-live)',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        Live
      </div>

      {/* Export button (ghost) */}
      <button
        style={{
          height: 38,
          padding: '0 16px',
          borderRadius: 'var(--radius-control)',
          backgroundColor: 'transparent',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontSize: 13.5,
          fontWeight: 600,
          cursor: 'pointer',
        }}
        onClick={() => alert('Export coming soon')}
      >
        Export
      </button>
    </header>
  )
}
