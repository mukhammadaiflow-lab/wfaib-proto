/**
 * API Health Check Tests
 */

import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}))

import handler from '@/pages/api/health'

describe('API Health Endpoint', () => {
  test('should return health status when database is connected', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    
    const data = JSON.parse(res._getData())
    expect(data.status).toBe('ok')
    expect(data.services.api).toBe('running')
    expect(data.services.database).toBe('connected')
    expect(data.version).toBe('0.1.0')
    expect(data.timestamp).toBeDefined()
  })

  test('should return error status when database is disconnected', async () => {
    // Mock database failure
    const prisma = require('@/lib/prisma').default
    prisma.$queryRaw.mockRejectedValueOnce(new Error('Connection failed'))

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(503)
    
    const data = JSON.parse(res._getData())
    expect(data.status).toBe('error')
    expect(data.services.database).toBe('disconnected')
  })
})
