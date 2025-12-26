import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { executeWorkflow } from '@/worker/executor'
import { WorkflowDefinition } from '@/types/workflow'

/**
 * API: Webhook Trigger
 * 
 * POST /api/webhook/:workflowId - Trigger workflow execution synchronously
 * 
 * This is a synchronous endpoint - it waits for the workflow to complete.
 * For async execution, use POST /api/runs/:workflowId instead.
 * 
 * TODO Phase 2: Add webhook signature verification
 * TODO Phase 2: Add rate limiting per workflow
 * TODO Phase 2: Add IP allowlist support
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  const { workflowId } = req.query
  const id = parseInt(workflowId as string, 10)

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid workflow ID' })
  }

  try {
    // Fetch workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id },
    })

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' })
    }

    const workflowDef = workflow.json as unknown as WorkflowDefinition

    // Check if workflow starts with a webhook node
    const hasWebhookStart = workflowDef.nodes.some(
      node => node.type === 'webhook' && 
      !workflowDef.edges.some(edge => edge.to === node.id)
    )

    if (!hasWebhookStart) {
      return res.status(400).json({ 
        error: 'Workflow does not have a webhook trigger node' 
      })
    }

    // Create run record
    const run = await prisma.run.create({
      data: {
        workflowId: id,
        status: 'pending',
        input: req.body as object || {},
      },
    })

    // Execute workflow synchronously
    const result = await executeWorkflow(workflowDef, req.body || {}, run.id)

    // Fetch updated run with logs
    const completedRun = await prisma.run.findUnique({
      where: { id: run.id },
      include: {
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return res.status(result.success ? 200 : 500).json({
      runId: run.id,
      workflowId: id,
      status: completedRun?.status,
      success: result.success,
      result: result.result,
      error: result.error,
      logsCount: completedRun?.logs.length || 0,
    })
  } catch (error) {
    console.error('Webhook trigger error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
