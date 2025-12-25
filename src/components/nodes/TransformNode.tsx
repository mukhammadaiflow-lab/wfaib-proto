import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

function TransformNode({ data, selected }: NodeProps) {
  return (
    <div className={`workflow-node transform ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#f59e0b' }}
      />
      <div className="workflow-node-header">
        <span>⚡</span>
        <span>{data.label || 'Transform'}</span>
      </div>
      <div className="workflow-node-type">Data Transform</div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#f59e0b' }}
      />
    </div>
  )
}

export default memo(TransformNode)
