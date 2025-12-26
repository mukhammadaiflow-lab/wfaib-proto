import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { WorkflowDefinition } from '@/types/workflow'

// Dynamic import to avoid SSR issues with React Flow
const WorkflowEditor = dynamic(() => import('@/components/WorkflowEditor'), {
  ssr: false,
  loading: () => (
    <div className="loading">
      <div className="spinner" />
    </div>
  ),
})

export default function NewWorkflow() {
  const router = useRouter()
  const [name, setName] = useState('New Workflow')
  const [error, setError] = useState<string | null>(null)

  async function handleSave(workflow: WorkflowDefinition) {
    setError(null)
    
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, json: workflow }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create workflow')
      }

      const data = await res.json()
      router.push(`/workflows/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <>
      <Head>
        <title>New Workflow | WFAIB Proto</title>
      </Head>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            color: 'var(--error)',
          }}
        >
          {error}
        </div>
      )}

      <WorkflowEditor
        workflowName={name}
        onNameChange={setName}
        onSave={handleSave}
      />
    </>
  )
}
