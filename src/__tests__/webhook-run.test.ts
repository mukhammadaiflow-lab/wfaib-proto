/**
 * Webhook Run Tests
 */

import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'

// Define mocks before jest.mock
const mockRun = { id: 1, workflowId: 1, status: 'pending' }
const mockWorkflowData = {
  id: 1,
  name: 'Test Workflow',
  json: {
    name: 'Test Workflow',
    nodes: [{ id: 'webhook1', type: 'webhook', config: {} }],
    edges: [],
  },
}

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    workflow: {
      findUnique: jest.fn(),
    },
    run: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    runLog: {
      create: jest.fn(),
    },
  },
}))

import handler from '@/pages/api/webhook/[workflowId]'
import prisma from '@/lib/prisma'

describe('Webhook Trigger Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Setup default mock returns
    ;(prisma.workflow.findUnique as jest.Mock).mockResolvedValue(mockWorkflowData)
    ;(prisma.run.create as jest.Mock).mockResolvedValue(mockRun)
    ;(prisma.run.update as jest.Mock).mockResolvedValue({ ...mockRun, status: 'completed' })
    ;(prisma.run.findUnique as jest.Mock).mockResolvedValue({
      ...mockRun,
      status: 'completed',
      logs: [{ id: 1, nodeId: 'webhook1', status: 'completed' }],
    })
    ;(prisma.runLog.create as jest.Mock).mockResolvedValue({ id: 1 })
  })

  test('should trigger workflow execution and return runId', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      query: { workflowId: '1' },
      body: { message: 'test payload' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    
    const data = JSON.parse(res._getData())
    expect(data.runId).toBe(1)
    expect(data.workflowId).toBe(1)
    expect(data.success).toBe(true)
  })

  test('should return 404 for non-existent workflow', async () => {
    ;(prisma.workflow.findUnique as jest.Mock).mockResolvedValueOnce(null)

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      query: { workflowId: '999' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(404)
    
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Workflow not found')
  })

  test('should reject non-POST requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { workflowId: '1' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
