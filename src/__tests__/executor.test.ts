/**
 * Executor Tests
 * 
 * Tests for the workflow executor module
 */

import { WorkflowDefinition } from '@/types/workflow'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    run: {
      update: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue({ id: 1, status: 'completed' }),
    },
    runLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
  },
}))

// Mock fetch for HTTP nodes
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve({ success: true, data: 'test' }),
  })
) as jest.Mock

// Import after mocking
import { executeWorkflow } from '@/worker/executor'

describe('Workflow Executor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should execute a simple webhook workflow', async () => {
    const workflow: WorkflowDefinition = {
      name: 'Test Webhook',
      nodes: [
        { id: 'webhook1', type: 'webhook', config: {} },
      ],
      edges: [],
    }

    const result = await executeWorkflow(workflow, { test: 'input' }, 1)

    expect(result.success).toBe(true)
    expect(result.result).toMatchObject({
      type: 'webhook',
      nodeId: 'webhook1',
      payload: { test: 'input' },
    })
  })

  test('should execute nodes in topological order', async () => {
    const workflow: WorkflowDefinition = {
      name: 'Multi-node Workflow',
      nodes: [
        { id: 'webhook1', type: 'webhook', config: {} },
        { id: 'llm1', type: 'llm', config: { prompt: 'Test prompt' } },
      ],
      edges: [
        { from: 'webhook1', to: 'llm1' },
      ],
    }

    const result = await executeWorkflow(workflow, { message: 'hello' }, 2)

    expect(result.success).toBe(true)
    expect(result.result).toMatchObject({
      content: expect.stringContaining('[MOCK LLM Response]'),
      mock: true,
    })
  })

  test('should handle transform node with mapping', async () => {
    const workflow: WorkflowDefinition = {
      name: 'Transform Workflow',
      nodes: [
        { id: 'webhook1', type: 'webhook', config: {} },
        { 
          id: 'transform1', 
          type: 'transform', 
          config: { 
            mapping: { 
              output: 'payload' 
            } 
          } 
        },
      ],
      edges: [
        { from: 'webhook1', to: 'transform1' },
      ],
    }

    const result = await executeWorkflow(workflow, { data: 'value' }, 3)

    expect(result.success).toBe(true)
  })

  test('should fail gracefully for cyclic workflows', async () => {
    const workflow: WorkflowDefinition = {
      name: 'Cyclic Workflow',
      nodes: [
        { id: 'node1', type: 'webhook', config: {} },
        { id: 'node2', type: 'transform', config: {} },
      ],
      edges: [
        { from: 'node1', to: 'node2' },
        { from: 'node2', to: 'node1' },
      ],
    }

    const result = await executeWorkflow(workflow, {}, 4)

    // Should fail because of cycle detection
    expect(result.success).toBe(false)
    expect(result.error).toContain('cycle')
  })
})
