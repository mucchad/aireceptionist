// Dashboard layout — minimal, no top bar (handled per page)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {children}
    </div>
  )
}
