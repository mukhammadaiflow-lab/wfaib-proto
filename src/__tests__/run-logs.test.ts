/**
 * Run Logs Tests
 */

import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'

// Mock Prisma before importing handler
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    run: {
      findUnique: jest.fn(),
    },
    workflow: {
      findUnique: jest.fn(),
    },
    runLog: {
      create: jest.fn(),
    },
  },
}))

import handler from '@/pages/api/runs/[id]'
import prisma from '@/lib/prisma'

const mockRunWithLogs = {
  id: 1,
  workflowId: 1,
  status: 'completed',
  input: { message: 'test' },
  result: { success: true },
  createdAt: new Date(),
  updatedAt: new Date(),
  workflow: { id: 1, name: 'Test Workflow' },
  logs: [
    {
      id: 1,
      nodeId: 'webhook1',
      nodeType: 'webhook',
      status: 'completed',
      input: { message: 'test' },
      output: { type: 'webhook', payload: { message: 'test' } },
      error: null,
      duration: 5,
      createdAt: new Date(),
    },
    {
      id: 2,
      nodeId: 'llm1',
      nodeType: 'llm',
      status: 'completed',
      input: { type: 'webhook' },
      output: { content: '[MOCK LLM Response]', mock: true },
      error: null,
      duration: 10,
      createdAt: new Date(),
    },
  ],
}

describe('Run Logs Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.run.findUnique as jest.Mock).mockResolvedValue(mockRunWithLogs)
  })

  test('should return run with logs', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { id: '1' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    
    const data = JSON.parse(res._getData())
    expect(data.id).toBe(1)
    expect(data.status).toBe('completed')
    expect(data.logs).toHaveLength(2)
    expect(data.logs[0].nodeId).toBe('webhook1')
    expect(data.logs[1].nodeId).toBe('llm1')
    expect(data.workflowName).toBe('Test Workflow')
  })

  test('should return log details for each node', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { id: '1' },
    })

    await handler(req, res)

    const data = JSON.parse(res._getData())
    const firstLog = data.logs[0]
    
    expect(firstLog).toMatchObject({
      nodeId: 'webhook1',
      nodeType: 'webhook',
      status: 'completed',
      duration: 5,
    })
    expect(firstLog.input).toBeDefined()
    expect(firstLog.output).toBeDefined()
  })

  test('should return 404 for non-existent run', async () => {
    ;(prisma.run.findUnique as jest.Mock).mockResolvedValueOnce(null)

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { id: '999' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(404)
    
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Run not found')
  })
})
