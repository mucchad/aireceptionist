'use client'

// Admin layout — top bar + left sidebar + main content area
// Sidebar has two sections: active accounts and deleted accounts

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/ui/top-bar'

function SidebarLink({
  href,
  icon,
  label,
  muted,
}: {
  href: string
  icon: string
  label: string
  muted?: boolean
}) {
  const pathname = usePathname()
  // Active if the path exactly matches, or is a subpath (but not /accounts matching /accounts/deleted)
  const isActive =
    href === '/accounts/deleted'
      ? pathname.startsWith('/accounts/deleted')
      : pathname === href || (pathname.startsWith(href + '/') && !pathname.startsWith('/accounts/deleted'))

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        borderRadius: 'var(--radius-control)',
        textDecoration: 'none',
        fontFamily: "'Hanken Grotesk', sans-serif",
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 500,
        color: isActive
          ? 'var(--color-text)'
          : muted
          ? 'var(--color-text-muted)'
          : 'var(--color-text-secondary)',
        backgroundColor: isActive ? 'var(--color-surface-sunken)' : 'transparent',
        transition: 'background-color 0.1s ease, color 0.1s ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'var(--color-surface-sunken)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
        }
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      {label}
    </Link>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <TopBar />

      <div style={{ display: 'flex' }}>
        {/* Left sidebar */}
        <aside
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: '1px solid var(--color-border)',
            minHeight: 'calc(100vh - 60px)',
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Section label */}
          <div
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              padding: '0 14px 8px',
            }}
          >
            Manage
          </div>

          <SidebarLink href="/accounts" icon="🏢" label="Accounts" />

          {/* Divider */}
          <div
            style={{
              height: 1,
              backgroundColor: 'var(--color-border)',
              margin: '12px 14px',
            }}
          />

          {/* Section label */}
          <div
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              padding: '0 14px 8px',
            }}
          >
            Archive
          </div>

          <SidebarLink href="/accounts/deleted" icon="🗑️" label="Deleted" muted />
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  )
}
