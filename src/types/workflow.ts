/**
 * Workflow type definitions
 */

export type NodeType = 'webhook' | 'http' | 'llm' | 'transform'

export interface WorkflowNode {
  id: string
  type: NodeType
  config: NodeConfig
  position?: { x: number; y: number }
}

export interface NodeConfig {
  // Webhook node
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  
  // HTTP node
  url?: string
  headers?: Record<string, string>
  body?: unknown
  
  // LLM node
  prompt?: string
  model?: string
  maxTokens?: number
  temperature?: number
  
  // Transform node
  expression?: string
  mapping?: Record<string, string>
}

export interface WorkflowEdge {
  id?: string
  from: string
  to: string
}

export interface WorkflowDefinition {
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface Workflow {
  id: number
  name: string
  ownerId: number
  createdAt: Date
  updatedAt: Date
  json: WorkflowDefinition
}

export interface Run {
  id: number
  workflowId: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  input?: unknown
  result?: unknown
  createdAt: Date
  updatedAt: Date
}

export interface RunLog {
  id: number
  runId: number
  nodeId: string
  nodeType: string
  status: 'started' | 'completed' | 'failed'
  input?: unknown
  output?: unknown
  error?: string
  duration?: number
  createdAt: Date
}

// API request/response types
export interface CreateWorkflowRequest {
  name: string
  json: WorkflowDefinition
}

export interface TriggerWebhookRequest {
  payload?: unknown
}

export interface QueueRunRequest {
  input?: unknown
}
