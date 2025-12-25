import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/workflows/new', label: 'New Workflow' },
  ]

  return (
    <div className="layout">
      <header className="header">
        <Link href="/">
          <h1>🔄 WFAIB Proto</h1>
        </Link>
        <nav>
          {navLinks.map(link => (
            <Link 
              key={link.href} 
              href={link.href}
              style={{ 
                color: router.pathname === link.href ? 'var(--text)' : undefined 
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="main">
        {children}
      </main>
    </div>
  )
}
