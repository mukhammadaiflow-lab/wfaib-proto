import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

interface RunLog {
  id: number
  nodeId: string
  nodeType: string
  status: string
  input: unknown
  output: unknown
  error: string | null
  duration: number | null
  createdAt: string
}

interface RunData {
  id: number
  workflowId: number
  workflowName: string
  status: string
  input: unknown
  result: unknown
  createdAt: string
  updatedAt: string
  logs: RunLog[]
}

export default function RunDetails() {
  const router = useRouter()
  const { id } = router.query

  const [run, setRun] = useState<RunData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchRun()
  }, [id])

  async function fetchRun() {
    try {
      const res = await fetch(`/api/runs/${id}`)
      if (!res.ok) throw new Error('Failed to fetch run')
      const data = await res.json()
      setRun(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function getStatusBadge(status: string) {
    const classes: Record<string, string> = {
      started: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-error',
      pending: 'badge-secondary',
      running: 'badge-warning',
    }
    return `badge ${classes[status] || 'badge-secondary'}`
  }

  function getNodeIcon(type: string) {
    const icons: Record<string, string> = {
      webhook: '🔗',
      http: '🌐',
      llm: '🤖',
      transform: '⚡',
    }
    return icons[type] || '📦'
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    )
  }

  if (error || !run) {
    return (
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--error)',
          borderRadius: '0.5rem',
          padding: '1rem',
          color: 'var(--error)',
        }}
      >
        {error || 'Run not found'}
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Run #{run.id} | WFAIB Proto</title>
      </Head>

      {/* Run Summary */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Run #{run.id}</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              <Link href={`/workflows/${run.workflowId}`}>{run.workflowName}</Link>
            </p>
          </div>
          <span className={getStatusBadge(run.status)}>
            {run.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Started
            </div>
            <div style={{ fontSize: '0.875rem' }}>{formatDate(run.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Completed
            </div>
            <div style={{ fontSize: '0.875rem' }}>{formatDate(run.updatedAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Nodes Executed
            </div>
            <div style={{ fontSize: '0.875rem' }}>{run.logs.length}</div>
          </div>
        </div>

        {/* Input/Output */}
        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Input
            </div>
            <pre
              style={{
                background: 'var(--background)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '150px',
              }}
            >
              {JSON.stringify(run.input, null, 2)}
            </pre>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Result
            </div>
            <pre
              style={{
                background: 'var(--background)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '150px',
              }}
            >
              {JSON.stringify(run.result, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Node Execution Logs */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Execution Log</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {run.logs.map((log, index) => (
            <div
              key={log.id}
              style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{getNodeIcon(log.nodeType)}</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{log.nodeId}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Step {index + 1} • {log.nodeType}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {log.duration !== null && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {log.duration}ms
                    </span>
                  )}
                  <span className={getStatusBadge(log.status)}>
                    {log.status}
                  </span>
                </div>
              </div>

              {log.error && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--error)',
                    borderRadius: '0.375rem',
                    padding: '0.5rem',
                    marginBottom: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--error)',
                  }}
                >
                  {log.error}
                </div>
              )}

              <details style={{ fontSize: '0.75rem' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  View Input/Output
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Input:</div>
                    <pre
                      style={{
                        background: 'var(--surface)',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        overflow: 'auto',
                        maxHeight: '100px',
                      }}
                    >
                      {JSON.stringify(log.input, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Output:</div>
                    <pre
                      style={{
                        background: 'var(--surface)',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        overflow: 'auto',
                        maxHeight: '100px',
                      }}
                    >
                      {JSON.stringify(log.output, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
