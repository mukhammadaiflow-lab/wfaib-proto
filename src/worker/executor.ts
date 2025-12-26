/**
 * Workflow Executor
 * 
 * Executes workflow nodes sequentially and logs results to RunLog table.
 * 
 * TODO Phase 2: Implement BullMQ for async job processing
 * TODO Phase 2: Implement Temporal for durable execution
 * TODO Phase 2: Add sandboxing for Transform nodes (vm2 or isolated-vm)
 * TODO Phase 2: Add timeout handling per node
 * TODO Phase 2: Implement retry logic with exponential backoff
 * TODO Phase 2: Add circuit breaker for external API calls
 */

import prisma from '@/lib/prisma'
import { executeLLM } from '@/lib/llm'
import { WorkflowDefinition, WorkflowNode, NodeType } from '@/types/workflow'

export interface ExecutionContext {
  input: unknown
  nodeOutputs: Record<string, unknown>
  runId: number
}

export interface NodeExecutionResult {
  success: boolean
  output: unknown
  error?: string
  duration: number
}

/**
 * Execute a complete workflow
 */
export async function executeWorkflow(
  workflow: WorkflowDefinition,
  input: unknown,
  runId: number
): Promise<{ success: boolean; result: unknown; error?: string }> {
  const context: ExecutionContext = {
    input,
    nodeOutputs: {},
    runId,
  }

  // Update run status to running
  await prisma.run.update({
    where: { id: runId },
    data: { status: 'running' },
  })

  try {
    // Build execution order from edges (topological sort)
    const executionOrder = buildExecutionOrder(workflow)
    
    let lastOutput: unknown = input

    for (const nodeId of executionOrder) {
      const node = workflow.nodes.find(n => n.id === nodeId)
      if (!node) {
        throw new Error(`Node ${nodeId} not found in workflow`)
      }

      // Get input for this node (output of previous node or initial input)
      const nodeInput = getPreviousOutput(node.id, workflow, context)

      // Log node start
      const startTime = Date.now()
      await logNodeExecution(runId, node, 'started', nodeInput)

      try {
        // Execute the node
        const result = await executeNode(node, nodeInput, context)
        
        if (!result.success) {
          throw new Error(result.error || 'Node execution failed')
        }

        // Store output in context
        context.nodeOutputs[node.id] = result.output
        lastOutput = result.output

        // Log node completion
        await logNodeExecution(runId, node, 'completed', nodeInput, result.output, undefined, result.duration)
      } catch (nodeError) {
        const errorMessage = nodeError instanceof Error ? nodeError.message : 'Unknown error'
        const duration = Date.now() - startTime

        // Log node failure
        await logNodeExecution(runId, node, 'failed', nodeInput, undefined, errorMessage, duration)

        throw nodeError
      }
    }

    // Update run as completed
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'completed',
        result: lastOutput as object,
      },
    })

    return { success: true, result: lastOutput }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Update run as failed
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'failed',
        result: { error: errorMessage },
      },
    })

    return { success: false, result: null, error: errorMessage }
  }
}

/**
 * Execute a single node based on its type
 */
async function executeNode(
  node: WorkflowNode,
  input: unknown,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const startTime = Date.now()

  try {
    let output: unknown

    switch (node.type) {
      case 'webhook':
        output = await executeWebhookNode(node, input)
        break
      case 'http':
        output = await executeHttpNode(node, input)
        break
      case 'llm':
        output = await executeLLMNode(node, input)
        break
      case 'transform':
        output = await executeTransformNode(node, input, context)
        break
      default:
        throw new Error(`Unknown node type: ${(node as WorkflowNode).type}`)
    }

    return {
      success: true,
      output,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success: false,
      output: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Webhook node - passthrough for trigger input
 */
async function executeWebhookNode(
  node: WorkflowNode,
  input: unknown
): Promise<unknown> {
  // Webhook node simply passes through the trigger input
  return {
    type: 'webhook',
    nodeId: node.id,
    receivedAt: new Date().toISOString(),
    payload: input,
  }
}

/**
 * HTTP node - makes external API calls
 * TODO Phase 2: Add request signing, OAuth support
 * TODO Phase 2: Add response caching
 */
async function executeHttpNode(
  node: WorkflowNode,
  input: unknown
): Promise<unknown> {
  const config = node.config
  const url = config.url

  if (!url) {
    throw new Error('HTTP node requires url in config')
  }

  const method = config.method || 'POST'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  }

  // Prepare body - use config body or previous node output
  const body = config.body !== undefined ? config.body : input

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    })

    const responseData = await response.json().catch(() => response.text())

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
    }
  } catch (error) {
    throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * LLM node - AI completion
 */
async function executeLLMNode(
  node: WorkflowNode,
  input: unknown
): Promise<unknown> {
  const config = node.config

  if (!config.prompt) {
    throw new Error('LLM node requires prompt in config')
  }

  const result = await executeLLM(
    {
      prompt: config.prompt,
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    },
    { previousOutput: input }
  )

  return result
}

/**
 * Transform node - data transformation
 * TODO Phase 2: CRITICAL - Add sandboxing! Current implementation is unsafe.
 * Consider: isolated-vm, vm2, or WebAssembly-based sandbox
 */
async function executeTransformNode(
  node: WorkflowNode,
  input: unknown,
  context: ExecutionContext
): Promise<unknown> {
  const config = node.config

  // Simple field mapping
  if (config.mapping && typeof input === 'object' && input !== null) {
    const result: Record<string, unknown> = {}
    const inputObj = input as Record<string, unknown>

    for (const [targetKey, sourceKey] of Object.entries(config.mapping)) {
      result[targetKey] = inputObj[sourceKey as string]
    }

    return result
  }

  // Expression evaluation (UNSAFE - needs sandboxing)
  if (config.expression) {
    // TODO Phase 2: SECURITY - Replace with safe expression evaluator
    // WARNING: This is intentionally limited for prototype
    console.warn('Transform expression evaluation is not sandboxed - prototype only!')
    
    // For prototype, only allow simple property access
    const safeExpression = /^[a-zA-Z_][a-zA-Z0-9_.]*$/
    if (!safeExpression.test(config.expression)) {
      throw new Error('Complex expressions not supported in prototype. Use mapping instead.')
    }

    // Simple dot notation access
    const parts = config.expression.split('.')
    let value: unknown = input
    for (const part of parts) {
      if (typeof value === 'object' && value !== null) {
        value = (value as Record<string, unknown>)[part]
      } else {
        value = undefined
        break
      }
    }

    return { result: value }
  }

  // Default: passthrough
  return input
}

/**
 * Build topological execution order from workflow edges
 */
function buildExecutionOrder(workflow: WorkflowDefinition): string[] {
  const { nodes, edges } = workflow
  const inDegree: Record<string, number> = {}
  const adjacency: Record<string, string[]> = {}

  // Initialize
  for (const node of nodes) {
    inDegree[node.id] = 0
    adjacency[node.id] = []
  }

  // Build graph
  for (const edge of edges) {
    adjacency[edge.from].push(edge.to)
    inDegree[edge.to]++
  }

  // Kahn's algorithm for topological sort
  const queue: string[] = []
  const result: string[] = []

  // Start with nodes that have no incoming edges
  for (const node of nodes) {
    if (inDegree[node.id] === 0) {
      queue.push(node.id)
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    result.push(nodeId)

    for (const neighbor of adjacency[nodeId]) {
      inDegree[neighbor]--
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor)
      }
    }
  }

  if (result.length !== nodes.length) {
    throw new Error('Workflow contains cycles')
  }

  return result
}

/**
 * Get output from previous node(s) in the workflow
 */
function getPreviousOutput(
  nodeId: string,
  workflow: WorkflowDefinition,
  context: ExecutionContext
): unknown {
  // Find edges pointing to this node
  const incomingEdges = workflow.edges.filter(e => e.to === nodeId)

  if (incomingEdges.length === 0) {
    // This is a start node, use workflow input
    return context.input
  }

  if (incomingEdges.length === 1) {
    // Single input - return that node's output
    return context.nodeOutputs[incomingEdges[0].from]
  }

  // Multiple inputs - merge outputs
  const merged: Record<string, unknown> = {}
  for (const edge of incomingEdges) {
    merged[edge.from] = context.nodeOutputs[edge.from]
  }
  return merged
}

/**
 * Log node execution to database
 */
async function logNodeExecution(
  runId: number,
  node: WorkflowNode,
  status: 'started' | 'completed' | 'failed',
  input?: unknown,
  output?: unknown,
  error?: string,
  duration?: number
): Promise<void> {
  await prisma.runLog.create({
    data: {
      runId,
      nodeId: node.id,
      nodeType: node.type,
      status,
      input: input as object,
      output: output as object,
      error,
      duration,
    },
  })
}

export default { executeWorkflow }
