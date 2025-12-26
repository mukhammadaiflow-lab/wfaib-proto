/**
 * Basic UI Render Tests
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    push: jest.fn(),
    query: {},
  }),
}))

// Mock fetch
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ workflows: [] }),
  })
) as jest.Mock

import Layout from '@/components/Layout'
import Dashboard from '@/pages/index'

describe('UI Render Tests', () => {
  test('should render Layout component with navigation', () => {
    render(
      <Layout>
        <div>Test content</div>
      </Layout>
    )

    expect(screen.getByText('🔄 WFAIB Proto')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('New Workflow')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  test('should render Dashboard page', async () => {
    render(<Dashboard />)

    // Should show loading initially or the workflows card
    expect(screen.getByText('Workflows')).toBeInTheDocument()
    expect(screen.getByText('+ New Workflow')).toBeInTheDocument()
  })

  test('should render empty state when no workflows', async () => {
    render(<Dashboard />)

    // Wait for async load
    await screen.findByText('No workflows yet', {}, { timeout: 3000 })
    
    expect(screen.getByText('No workflows yet')).toBeInTheDocument()
    expect(screen.getByText('Create Workflow')).toBeInTheDocument()
  })
})
