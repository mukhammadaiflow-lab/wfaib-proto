import { useState, useCallback, useRef, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { nodeTypes } from './nodes'
import { WorkflowDefinition, WorkflowNode, WorkflowEdge, NodeType } from '@/types/workflow'
import { v4 as uuid } from 'uuid'

interface WorkflowEditorProps {
  initialWorkflow?: WorkflowDefinition
  onSave: (workflow: WorkflowDefinition) => Promise<void>
  workflowName: string
  onNameChange: (name: string) => void
}

interface PaletteItem {
  type: NodeType
  label: string
  icon: string
  defaultConfig: Record<string, unknown>
}

const paletteItems: PaletteItem[] = [
  {
    type: 'webhook',
    label: 'Webhook',
    icon: '🔗',
    defaultConfig: {},
  },
  {
    type: 'http',
    label: 'HTTP Request',
    icon: '🌐',
    defaultConfig: { url: 'https://httpbin.org/post', method: 'POST' },
  },
  {
    type: 'llm',
    label: 'LLM / AI',
    icon: '🤖',
    defaultConfig: { prompt: 'Process the following data:', model: 'mock-gpt-4' },
  },
  {
    type: 'transform',
    label: 'Transform',
    icon: '⚡',
    defaultConfig: { mapping: {} },
  },
]

function convertToReactFlowNodes(workflowNodes: WorkflowNode[]): Node[] {
  return workflowNodes.map((node, index) => ({
    id: node.id,
    type: node.type,
    position: node.position || { x: 100 + index * 200, y: 100 },
    data: {
      label: node.id,
      config: node.config,
    },
  }))
}

function convertToReactFlowEdges(workflowEdges: WorkflowEdge[]): Edge[] {
  return workflowEdges.map((edge, index) => ({
    id: edge.id || `e${index}`,
    source: edge.from,
    target: edge.to,
    animated: true,
  }))
}

function convertFromReactFlow(
  nodes: Node[],
  edges: Edge[],
  name: string
): WorkflowDefinition {
  return {
    name,
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type as NodeType,
      config: node.data.config || {},
      position: node.position,
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      from: edge.source,
      to: edge.target,
    })),
  }
}

function WorkflowEditorInner({
  initialWorkflow,
  onSave,
  workflowName,
  onNameChange,
}: WorkflowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [saving, setSaving] = useState(false)

  const initialNodes = initialWorkflow
    ? convertToReactFlowNodes(initialWorkflow.nodes)
    : []
  const initialEdges = initialWorkflow
    ? convertToReactFlowEdges(initialWorkflow.edges)
    : []

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current || !reactFlowInstance) return

      const type = event.dataTransfer.getData('application/nodeType') as NodeType
      const configStr = event.dataTransfer.getData('application/nodeConfig')
      const config = configStr ? JSON.parse(configStr) : {}

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      const newNode: Node = {
        id: `${type}_${uuid().slice(0, 8)}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
          config,
        },
      }

      setNodes(nds => [...nds, newNode])
    },
    [reactFlowInstance, setNodes]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const updateNodeConfig = useCallback(
    (key: string, value: unknown) => {
      if (!selectedNode) return

      setNodes(nds =>
        nds.map(node => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  [key]: value,
                },
              },
            }
          }
          return node
        })
      )

      setSelectedNode(prev =>
        prev
          ? {
              ...prev,
              data: {
                ...prev.data,
                config: { ...prev.data.config, [key]: value },
              },
            }
          : null
      )
    },
    [selectedNode, setNodes]
  )

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return

    setNodes(nds => nds.filter(n => n.id !== selectedNode.id))
    setEdges(eds =>
      eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id)
    )
    setSelectedNode(null)
  }, [selectedNode, setNodes, setEdges])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const workflow = convertFromReactFlow(nodes, edges, workflowName)
      await onSave(workflow)
    } finally {
      setSaving(false)
    }
  }, [nodes, edges, workflowName, onSave])

  const nodeTypesMemo = useMemo(() => nodeTypes, [])

  return (
    <div className="editor-container">
      {/* Node Palette */}
      <div className="node-palette">
        <h3>Nodes</h3>
        {paletteItems.map(item => (
          <div
            key={item.type}
            className="palette-item"
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('application/nodeType', item.type)
              e.dataTransfer.setData(
                'application/nodeConfig',
                JSON.stringify(item.defaultConfig)
              )
              e.dataTransfer.effectAllowed = 'move'
            }}
          >
            <div className={`palette-icon ${item.type}`}>{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}

        <div style={{ marginTop: '2rem' }}>
          <h3>Workflow</h3>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={workflowName}
              onChange={e => onNameChange(e.target.value)}
              placeholder="My Workflow"
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleSave}
            disabled={saving || !workflowName}
          >
            {saving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flow-canvas" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypesMemo}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
        >
          <Controls />
          <MiniMap
            nodeColor={node => {
              switch (node.type) {
                case 'webhook':
                  return '#22c55e'
                case 'http':
                  return '#3b82f6'
                case 'llm':
                  return '#a855f7'
                case 'transform':
                  return '#f59e0b'
                default:
                  return '#64748b'
              }
            }}
          />
          <Background gap={15} size={1} />
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      <div className="properties-panel">
        <h3>Properties</h3>
        {selectedNode ? (
          <>
            <div className="form-group">
              <label className="form-label">Node ID</label>
              <input
                type="text"
                className="form-input"
                value={selectedNode.id}
                disabled
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <input
                type="text"
                className="form-input"
                value={selectedNode.type || ''}
                disabled
              />
            </div>

            {/* Type-specific config fields */}
            {selectedNode.type === 'http' && (
              <>
                <div className="form-group">
                  <label className="form-label">URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedNode.data.config?.url || ''}
                    onChange={e => updateNodeConfig('url', e.target.value)}
                    placeholder="https://api.example.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Method</label>
                  <select
                    className="form-input"
                    value={selectedNode.data.config?.method || 'POST'}
                    onChange={e => updateNodeConfig('method', e.target.value)}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </>
            )}

            {selectedNode.type === 'llm' && (
              <>
                <div className="form-group">
                  <label className="form-label">Prompt</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={selectedNode.data.config?.prompt || ''}
                    onChange={e => updateNodeConfig('prompt', e.target.value)}
                    placeholder="Enter your prompt..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedNode.data.config?.model || 'mock-gpt-4'}
                    onChange={e => updateNodeConfig('model', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedNode.type === 'transform' && (
              <div className="form-group">
                <label className="form-label">Expression</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedNode.data.config?.expression || ''}
                  onChange={e => updateNodeConfig('expression', e.target.value)}
                  placeholder="data.field"
                />
              </div>
            )}

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '1rem', color: 'var(--error)' }}
              onClick={deleteSelectedNode}
            >
              Delete Node
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Select a node to edit its properties, or drag nodes from the palette
            to build your workflow.
          </p>
        )}
      </div>
    </div>
  )
}

export default function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner {...props} />
    </ReactFlowProvider>
  )
}
