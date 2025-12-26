import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

function HttpNode({ data, selected }: NodeProps) {
  return (
    <div className={`workflow-node http ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#3b82f6' }}
      />
      <div className="workflow-node-header">
        <span>🌐</span>
        <span>{data.label || 'HTTP Request'}</span>
      </div>
      <div className="workflow-node-type">
        {data.config?.method || 'POST'} {data.config?.url ? new URL(data.config.url).hostname : 'API'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#3b82f6' }}
      />
    </div>
  )
}

export default memo(HttpNode)
