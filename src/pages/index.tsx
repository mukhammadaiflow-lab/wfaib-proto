import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'

interface WorkflowSummary {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  runCount: number
}

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkflows()
  }, [])

  async function fetchWorkflows() {
    try {
      const res = await fetch('/api/workflows')
      if (!res.ok) throw new Error('Failed to fetch workflows')
      const data = await res.json()
      setWorkflows(data.workflows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function deleteWorkflow(id: number) {
    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      const res = await fetch(`/api/workflows/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete workflow')
      setWorkflows(workflows.filter(w => w.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
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

  return (
    <>
      <Head>
        <title>Dashboard | WFAIB Proto</title>
      </Head>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Workflows</h2>
          <Link href="/workflows/new" className="btn btn-primary">
            + New Workflow
          </Link>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--error)', padding: '1rem' }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && workflows.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No workflows yet</div>
            <div className="empty-state-text">
              Create your first workflow to get started with automation.
            </div>
            <Link href="/workflows/new" className="btn btn-primary">
              Create Workflow
            </Link>
          </div>
        )}

        {!loading && !error && workflows.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Runs</th>
                <th>Created</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map(workflow => (
                <tr key={workflow.id}>
                  <td>
                    <Link href={`/workflows/${workflow.id}`}>
                      <strong>{workflow.name}</strong>
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-secondary">
                      {workflow.runCount} runs
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {formatDate(workflow.createdAt)}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {formatDate(workflow.updatedAt)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/workflows/${workflow.id}`} className="btn btn-secondary btn-sm">
                        Edit
                      </Link>
                      <Link href={`/workflows/${workflow.id}/runs`} className="btn btn-secondary btn-sm">
                        Runs
                      </Link>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--error)' }}
                        onClick={() => deleteWorkflow(workflow.id)}
                      >
                        Delete
                      </button>
                    </div>
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
