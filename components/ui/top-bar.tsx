// Top bar — shared across admin pages
// Shows the AI Switchboard brand, "Admin" pill, and user avatar

interface TopBarProps {
  showSearch?: boolean
}

// AI icon — a simple circuit/spark SVG that reads clearly at small sizes
function AiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="2" fill="white" />
      <circle cx="7" cy="1.5" r="1" fill="white" opacity="0.8" />
      <circle cx="7" cy="12.5" r="1" fill="white" opacity="0.8" />
      <circle cx="1.5" cy="7" r="1" fill="white" opacity="0.8" />
      <circle cx="12.5" cy="7" r="1" fill="white" opacity="0.8" />
      <line x1="7" y1="3" x2="7" y2="5" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <line x1="7" y1="9" x2="7" y2="11" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <line x1="3" y1="7" x2="5" y2="7" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <line x1="9" y1="7" x2="11" y2="7" stroke="white" strokeWidth="1.2" opacity="0.6" />
    </svg>
  )
}

export function TopBar({ showSearch = true }: TopBarProps) {
  return (
    <header
      style={{
        height: 60,
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Brand lockup */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Logo mark */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 'var(--radius-logo)',
            backgroundColor: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AiIcon />
        </div>

        {/* Wordmark */}
        <span
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          Switchboard
        </span>
      </div>

      {/* Admin pill */}
      <span
        style={{
          fontFamily: "'Hanken Grotesk', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-pill)',
          padding: '3px 10px',
        }}
      >
        Admin
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      {showSearch && (
        <input
          type="text"
          placeholder="Search accounts…"
          style={{
            width: 240,
            height: 34,
            backgroundColor: 'var(--color-surface-sunken)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-control)',
            padding: '0 12px',
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: 13,
            color: 'var(--color-text)',
            outline: 'none',
          }}
        />
      )}

      {/* User avatar */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'var(--color-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--color-on-accent)',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        V
      </div>
    </header>
  )
}
