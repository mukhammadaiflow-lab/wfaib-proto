import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

function WebhookNode({ data, selected }: NodeProps) {
  return (
    <div className={`workflow-node webhook ${selected ? 'selected' : ''}`}>
      <div className="workflow-node-header">
        <span>🔗</span>
        <span>{data.label || 'Webhook'}</span>
      </div>
      <div className="workflow-node-type">Webhook Trigger</div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#22c55e' }}
      />
    </div>
  )
}

export default memo(WebhookNode)
