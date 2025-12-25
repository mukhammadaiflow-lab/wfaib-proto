import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

function LLMNode({ data, selected }: NodeProps) {
  return (
    <div className={`workflow-node llm ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#a855f7' }}
      />
      <div className="workflow-node-header">
        <span>🤖</span>
        <span>{data.label || 'LLM'}</span>
      </div>
      <div className="workflow-node-type">
        {data.config?.model || 'AI Completion'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#a855f7' }}
      />
    </div>
  )
}

export default memo(LLMNode)
