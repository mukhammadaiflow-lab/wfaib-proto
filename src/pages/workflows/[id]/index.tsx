import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { WorkflowDefinition } from '@/types/workflow'

const WorkflowEditor = dynamic(() => import('@/components/WorkflowEditor'), {
  ssr: false,
  loading: () => (
    <div className="loading">
      <div className="spinner" />
    </div>
  ),
})

interface WorkflowData {
  id: number
  name: string
  json: WorkflowDefinition
}

export default function EditWorkflow() {
  const router = useRouter()
  const { id } = router.query

  const [workflow, setWorkflow] = useState<WorkflowData | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setName(data.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(workflowDef: WorkflowDefinition) {
    setError(null)

    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, json: workflowDef }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update workflow')
      }

      // Show success feedback
      alert('Workflow saved successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
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
        <title>{name} | WFAIB Proto</title>
      </Head>

      <WorkflowEditor
        initialWorkflow={workflow.json}
        workflowName={name}
        onNameChange={setName}
        onSave={handleSave}
      />
    </>
  )
}
