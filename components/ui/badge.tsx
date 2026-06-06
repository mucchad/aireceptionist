// Status pill badge — used for account status (Live/POC) and lead status (New/Contacted/Resolved)

type BadgeVariant = 'live' | 'poc' | 'new' | 'contacted' | 'resolved' | 'cancelled'

interface BadgeProps {
  variant: BadgeVariant
  label?: string  // override the default label if needed
}

const variantStyles: Record<BadgeVariant, { color: string; bg: string; label: string }> = {
  live:      { color: 'var(--color-live)',         bg: 'var(--color-live-weak)',      label: 'Live' },
  poc:       { color: 'var(--color-amber)',         bg: 'var(--color-amber-weak)',     label: 'POC' },
  new:       { color: 'var(--color-accent-text)',   bg: 'var(--color-accent-weak)',    label: 'New' },
  contacted: { color: 'var(--color-amber)',         bg: 'var(--color-amber-weak)',     label: 'Contacted' },
  resolved:  { color: 'var(--color-text-muted)',    bg: 'var(--color-surface-sunken)', label: 'Resolved' },
  cancelled: { color: 'var(--color-text-muted)',    bg: 'var(--color-surface-sunken)', label: 'Cancelled' },
}

export function Badge({ variant, label }: BadgeProps) {
  const styles = variantStyles[variant]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: "'Hanken Grotesk', sans-serif",
        fontSize: 11.5,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 'var(--radius-pill)',
        color: styles.color,
        backgroundColor: styles.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {/* Leading dot */}
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          flexShrink: 0,
        }}
      />
      {label ?? styles.label}
    </span>
  )
}
