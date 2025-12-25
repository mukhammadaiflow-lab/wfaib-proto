import { Handle, NodeProps, Position } from "reactflow";
import { NodeShell } from "@/components/flow/NodeShell";

export function WebhookNode({ data }: NodeProps) {
  return (
    <NodeShell title="Webhook" subtitle="trigger">
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Entry point. Input = request body.
      </div>
      <Handle type="source" position={Position.Right} />
    </NodeShell>
  );
}

export function HttpNode({ id, data, setData }: NodeProps & { setData?: any }) {
  return (
    <NodeShell title="HTTP" subtitle="fetch">
      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, opacity: 0.8 }}>URL</label>
        <input
          className="input"
          value={data?.url ?? ""}
          onChange={(e) => setData?.(id, { ...data, url: e.target.value })}
          placeholder="https://httpbin.org/post"
        />
        <label style={{ fontSize: 12, opacity: 0.8 }}>Method</label>
        <input
          className="input"
          value={data?.method ?? "POST"}
          onChange={(e) => setData?.(id, { ...data, method: e.target.value })}
          placeholder="POST"
        />
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </NodeShell>
  );
}

export function LlmNode({ id, data, setData }: NodeProps & { setData?: any }) {
  return (
    <NodeShell title="LLM" subtitle="mock">
      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, opacity: 0.8 }}>Prompt</label>
        <textarea
          className="input"
          value={data?.prompt ?? "Summarize the input as JSON."}
          onChange={(e) => setData?.(id, { ...data, prompt: e.target.value })}
          style={{ minHeight: 90, resize: "vertical" }}
        />
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Default is mock mode. TODO: integrate real provider + secrets vault.
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </NodeShell>
  );
}

export function TransformNode({ id, data, setData }: NodeProps & { setData?: any }) {
  return (
    <NodeShell title="Transform" subtitle="js">
      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, opacity: 0.8 }}>Expression</label>
        <textarea
          className="input"
          value={data?.expr ?? "({ ...input })"}
          onChange={(e) => setData?.(id, { ...data, expr: e.target.value })}
          style={{ minHeight: 90, resize: "vertical", fontFamily: "ui-monospace" }}
        />
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          TODO(security): run untrusted transforms in a sandbox.
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </NodeShell>
  );
}

