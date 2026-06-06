// Initials avatar — shows up to 2 letters from a name in a warm terracotta circle

interface AvatarProps {
  name: string
  size?: 'sm' | 'md'  // sm = 30px (top bar), md = 34px (rows)
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  // Pull up to 2 initials from the name
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const dimensions = size === 'sm' ? 30 : 34
  const fontSize = size === 'sm' ? 11 : 13

  return (
    <div
      style={{
        width: dimensions,
        height: dimensions,
        borderRadius: 'var(--radius-pill)',
        backgroundColor: 'var(--color-accent-weak)',
        color: 'var(--color-accent-text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}
