import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

interface WorkflowRun {
  id: number
  status: string
  createdAt: string
}

interface WorkflowData {
  id: number
  name: string
  recentRuns: WorkflowRun[]
}

export default function WorkflowRuns() {
  const router = useRouter()
  const { id } = router.query

  const [workflow, setWorkflow] = useState<WorkflowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [triggering, setTriggering] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchWorkflow()
  }, [id])

  async function fetchWorkflow() {
    try {
      const res = await fetch(`/api/workflows/${id}`)
      if (!res.ok) throw new Error('Failed to fetch workflow')
      const data = await res.json()
      setWorkflow(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function triggerRun() {
    setTriggering(true)
    try {
      const res = await fetch(`/api/webhook/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Manual trigger', timestamp: new Date().toISOString() }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to trigger run')
      }
      
      const data = await res.json()
      router.push(`/runs/${data.runId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to trigger')
    } finally {
      setTriggering(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getStatusBadge(status: string) {
    const classes: Record<string, string> = {
      pending: 'badge-secondary',
      running: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-error',
    }
    return `badge ${classes[status] || 'badge-secondary'}`
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    )
  }

  if (error || !workflow) {
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
        {error || 'Workflow not found'}
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Runs - {workflow.name} | WFAIB Proto</title>
      </Head>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">{workflow.name}</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              Workflow Runs
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href={`/workflows/${id}`} className="btn btn-secondary">
              Edit Workflow
            </Link>
            <button
              className="btn btn-primary"
              onClick={triggerRun}
              disabled={triggering}
            >
              {triggering ? 'Triggering...' : '▶ Trigger Run'}
            </button>
          </div>
        </div>

        {workflow.recentRuns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏃</div>
            <div className="empty-state-title">No runs yet</div>
            <div className="empty-state-text">
              Trigger a run to execute this workflow.
            </div>
            <button
              className="btn btn-primary"
              onClick={triggerRun}
              disabled={triggering}
            >
              Trigger First Run
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflow.recentRuns.map(run => (
                <tr key={run.id}>
                  <td>
                    <Link href={`/runs/${run.id}`}>
                      <strong>#{run.id}</strong>
                    </Link>
                  </td>
                  <td>
                    <span className={getStatusBadge(run.status)}>
                      {run.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {formatDate(run.createdAt)}
                  </td>
                  <td>
                    <Link href={`/runs/${run.id}`} className="btn btn-secondary btn-sm">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
