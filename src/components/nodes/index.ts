import WebhookNode from './WebhookNode'
import HttpNode from './HttpNode'
import LLMNode from './LLMNode'
import TransformNode from './TransformNode'

export const nodeTypes = {
  webhook: WebhookNode,
  http: HttpNode,
  llm: LLMNode,
  transform: TransformNode,
}

export { WebhookNode, HttpNode, LLMNode, TransformNode }
