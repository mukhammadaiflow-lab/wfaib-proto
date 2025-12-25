import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

/**
 * API: Auth Stub
 * 
 * POST /api/auth/login - Simple email-only auth (prototype)
 * 
 * TODO Phase 2: Implement proper auth with NextAuth.js or similar
 * TODO Phase 2: Add password hashing with bcrypt
 * TODO Phase 2: Add JWT tokens or session management
 * TODO Phase 2: Add OAuth providers (Google, GitHub)
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  const { email } = req.body

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' })
  }

  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  try {
    // Find or create user (prototype auth)
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { email },
      })
    }

    // TODO Phase 2: Generate and return JWT token
    // const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET)

    return res.status(200).json({
      message: 'Login successful (prototype)',
      user: {
        id: user.id,
        email: user.email,
      },
      // TODO Phase 2: Return actual token
      token: `stub-token-${user.id}`,
    })
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
