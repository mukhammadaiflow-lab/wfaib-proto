import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
  services: {
    database: 'connected' | 'disconnected'
    api: 'running'
  }
  version: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  let dbStatus: 'connected' | 'disconnected' = 'disconnected'

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    dbStatus = 'connected'
  } catch (error) {
    console.error('Database health check failed:', error)
  }

  const response: HealthResponse = {
    status: dbStatus === 'connected' ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      api: 'running',
    },
    version: '0.1.0',
  }

  const statusCode = dbStatus === 'connected' ? 200 : 503
  res.status(statusCode).json(response)
}
