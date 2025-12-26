import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { executeWorkflow } from '@/worker/executor'
import { WorkflowDefinition } from '@/types/workflow'

/**
 * API: Runs
 * 
 * POST /api/runs/:workflowId - Queue a new run (stub - executes synchronously in prototype)
 * GET /api/runs/:runId - Get run details with logs
 * 
 * TODO Phase 2: Implement async job queue with BullMQ
 * TODO Phase 2: Add run cancellation
 * TODO Phase 2: Add run replay/retry
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  try {
    switch (req.method) {
      case 'POST':
        // POST /api/runs/:workflowId - Queue new run
        return await queueRun(id as string, req, res)
      case 'GET':
        // GET /api/runs/:runId - Get run details
        return await getRun(id as string, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Runs API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function queueRun(
  workflowIdStr: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const workflowId = parseInt(workflowIdStr, 10)

  if (isNaN(workflowId)) {
    return res.status(400).json({ error: 'Invalid workflow ID' })
  }

  // Fetch workflow
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  })

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' })
  }

  const workflowDef = workflow.json as unknown as WorkflowDefinition
  const input = req.body?.input || {}

  // Create run record
  const run = await prisma.run.create({
    data: {
      workflowId,
      status: 'pending',
      input: input as object,
    },
  })

  // TODO Phase 2: Queue job with BullMQ instead of synchronous execution
  // const job = await runQueue.add('execute', { runId: run.id, workflowId })
  // return res.status(202).json({ runId: run.id, jobId: job.id, status: 'queued' })

  // Prototype: Execute synchronously in background (non-blocking response)
  // For true async, we'd use BullMQ/Temporal
  
  // Execute immediately (synchronous prototype)
  const result = await executeWorkflow(workflowDef, input, run.id)

  return res.status(202).json({
    runId: run.id,
    workflowId,
    status: result.success ? 'completed' : 'failed',
    message: 'Run executed (prototype mode - synchronous)',
  })
}

async function getRun(runIdStr: string, res: NextApiResponse) {
  const runId = parseInt(runIdStr, 10)

  if (isNaN(runId)) {
    return res.status(400).json({ error: 'Invalid run ID' })
  }

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
      logs: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!run) {
    return res.status(404).json({ error: 'Run not found' })
  }

  return res.status(200).json({
    id: run.id,
    workflowId: run.workflowId,
    workflowName: run.workflow.name,
    status: run.status,
    input: run.input,
    result: run.result,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    logs: run.logs.map(log => ({
      id: log.id,
      nodeId: log.nodeId,
      nodeType: log.nodeType,
      status: log.status,
      input: log.input,
      output: log.output,
      error: log.error,
      duration: log.duration,
      createdAt: log.createdAt,
    })),
  })
}
