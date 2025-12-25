import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { CreateWorkflowRequest, WorkflowDefinition } from '@/types/workflow'

/**
 * API: Workflows
 * 
 * POST /api/workflows - Create a new workflow
 * GET /api/workflows - List all workflows (for current user)
 * 
 * TODO Phase 2: Add pagination for listing
 * TODO Phase 2: Add filtering and search
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'POST':
        return await createWorkflow(req, res)
      case 'GET':
        return await listWorkflows(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Workflow API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function createWorkflow(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name, json } = req.body as CreateWorkflowRequest

  if (!name || !json) {
    return res.status(400).json({ error: 'name and json are required' })
  }

  // Validate workflow structure
  const validation = validateWorkflowDefinition(json)
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error })
  }

  // TODO Phase 2: Get user from auth session
  // For prototype, use or create a default user
  let user = await prisma.user.findFirst()
  if (!user) {
    user = await prisma.user.create({
      data: { email: 'default@wfaib.local' }
    })
  }

  const workflow = await prisma.workflow.create({
    data: {
      name,
      ownerId: user.id,
      json: json as object,
    },
  })

  return res.status(201).json({
    id: workflow.id,
    name: workflow.name,
    createdAt: workflow.createdAt,
    json: workflow.json,
  })
}

async function listWorkflows(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO Phase 2: Filter by current user from auth session
  const workflows = await prisma.workflow.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { runs: true }
      }
    }
  })

  return res.status(200).json({
    workflows: workflows.map(w => ({
      id: w.id,
      name: w.name,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      runCount: w._count.runs,
    }))
  })
}

function validateWorkflowDefinition(json: WorkflowDefinition): { valid: boolean; error?: string } {
  if (!json.name) {
    return { valid: false, error: 'Workflow JSON must have a name' }
  }

  if (!Array.isArray(json.nodes)) {
    return { valid: false, error: 'Workflow must have nodes array' }
  }

  if (!Array.isArray(json.edges)) {
    return { valid: false, error: 'Workflow must have edges array' }
  }

  const validNodeTypes = ['webhook', 'http', 'llm', 'transform']
  for (const node of json.nodes) {
    if (!node.id || !node.type) {
      return { valid: false, error: 'Each node must have id and type' }
    }
    if (!validNodeTypes.includes(node.type)) {
      return { valid: false, error: `Invalid node type: ${node.type}` }
    }
  }

  const nodeIds = new Set(json.nodes.map(n => n.id))
  for (const edge of json.edges) {
    if (!edge.from || !edge.to) {
      return { valid: false, error: 'Each edge must have from and to' }
    }
    if (!nodeIds.has(edge.from)) {
      return { valid: false, error: `Edge references unknown node: ${edge.from}` }
    }
    if (!nodeIds.has(edge.to)) {
      return { valid: false, error: `Edge references unknown node: ${edge.to}` }
    }
  }

  return { valid: true }
}
