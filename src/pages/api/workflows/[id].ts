import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

/**
 * API: Single Workflow
 * 
 * GET /api/workflows/:id - Get workflow by ID
 * PUT /api/workflows/:id - Update workflow
 * DELETE /api/workflows/:id - Delete workflow
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query
  const workflowId = parseInt(id as string, 10)

  if (isNaN(workflowId)) {
    return res.status(400).json({ error: 'Invalid workflow ID' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getWorkflow(workflowId, res)
      case 'PUT':
        return await updateWorkflow(workflowId, req, res)
      case 'DELETE':
        return await deleteWorkflow(workflowId, res)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Workflow API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getWorkflow(id: number, res: NextApiResponse) {
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, email: true }
      },
      runs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          createdAt: true,
        }
      }
    }
  })

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' })
  }

  return res.status(200).json({
    id: workflow.id,
    name: workflow.name,
    owner: workflow.owner,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
    json: workflow.json,
    recentRuns: workflow.runs,
  })
}

async function updateWorkflow(
  id: number,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name, json } = req.body

  const workflow = await prisma.workflow.findUnique({ where: { id } })
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' })
  }

  const updated = await prisma.workflow.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(json && { json }),
    },
  })

  return res.status(200).json({
    id: updated.id,
    name: updated.name,
    updatedAt: updated.updatedAt,
    json: updated.json,
  })
}

async function deleteWorkflow(id: number, res: NextApiResponse) {
  const workflow = await prisma.workflow.findUnique({ where: { id } })
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' })
  }

  // Delete associated runs and logs first
  await prisma.runLog.deleteMany({
    where: { run: { workflowId: id } }
  })
  await prisma.run.deleteMany({ where: { workflowId: id } })
  await prisma.workflow.delete({ where: { id } })

  return res.status(200).json({ message: 'Workflow deleted' })
}
