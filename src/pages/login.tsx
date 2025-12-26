import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

/**
 * Login Page (Prototype)
 * 
 * TODO Phase 2: Implement proper auth with NextAuth.js
 * TODO Phase 2: Add OAuth providers
 * TODO Phase 2: Add password field with proper hashing
 */

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }

      // In prototype, just redirect to dashboard
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login | WFAIB Proto</title>
      </Head>

      <div
        style={{
          maxWidth: '400px',
          margin: '4rem auto',
        }}
      >
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            Login to WFAIB
          </h2>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
            }}
          >
            Prototype auth - email only, no password required
          </p>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--error)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: 'var(--error)',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
