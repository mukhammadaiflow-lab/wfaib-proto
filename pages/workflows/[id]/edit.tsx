import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { NavBar } from "@/components/NavBar";
import { useRequireAuth } from "@/lib/auth";
import { HttpNode, LlmNode, TransformNode, WebhookNode } from "@/components/flow/nodes";

type WorkflowPayload = { id: number; name: string; json: any };

const PALETTE: Array<{ type: string; title: string; hint: string }> = [
  { type: "webhook", title: "Webhook", hint: "Trigger node" },
  { type: "http", title: "HTTP", hint: "Fetch URL" },
  { type: "llm", title: "LLM (mock)", hint: "Call mock LLM" },
  { type: "transform", title: "Transform", hint: "JS expression" },
];

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { email } = useRequireAuth();
  const id = router.query.id as string | undefined;

  const [workflow, setWorkflow] = useState<WorkflowPayload | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastRunId, setLastRunId] = useState<number | null>(null);

  const setNodeData = useCallback(
    (nodeId: string, data: any) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data } : n)));
    },
    [setNodes]
  );

  const nodeTypes = useMemo(
    () => ({
      webhook: WebhookNode,
      http: (p: any) => <HttpNode {...p} setData={setNodeData} />,
      llm: (p: any) => <LlmNode {...p} setData={setNodeData} />,
      transform: (p: any) => <TransformNode {...p} setData={setNodeData} />,
    }),
    [setNodeData]
  );

  useEffect(() => {
    if (!id) return;
    fetch(`/api/workflows/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setWorkflow(data.workflow);
        setNodes(data.workflow?.json?.nodes ?? []);
        setEdges(data.workflow?.json?.edges ?? []);
      });
  }, [id, setEdges, setNodes]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("application/wfaib-node", type);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/wfaib-node");
      if (!type || !rf) return;
      const bounds = (e.target as HTMLDivElement).getBoundingClientRect?.();
      const position = rf.screenToFlowPosition({
        x: e.clientX - (bounds?.left ?? 0),
        y: e.clientY - (bounds?.top ?? 0),
      });
      const nodeId = `${type}-${Date.now()}`;
      const base: Node = {
        id: nodeId,
        type,
        position,
        data: { label: type.toUpperCase() },
      };
      const withDefaults =
        type === "http"
          ? { ...base, data: { ...base.data, method: "POST", url: "" } }
          : type === "llm"
            ? { ...base, data: { ...base.data, prompt: "Summarize input." } }
            : type === "transform"
              ? { ...base, data: { ...base.data, expr: "({ ...input })" } }
              : base;
      setNodes((nds) => nds.concat(withDefaults));
    },
    [rf, setNodes]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  if (!email) return null;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div
          style={{
            width: 280,
            borderRight: "1px solid rgba(255,255,255,0.08)",
            padding: 16,
            background: "#0c1226",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Node palette</div>
          <div style={{ opacity: 0.75, fontSize: 13, marginBottom: 12 }}>
            Drag nodes into the canvas.
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {PALETTE.map((p) => (
              <div
                key={p.type}
                draggable
                onDragStart={(e) => onDragStart(e, p.type)}
                className="card"
                style={{ cursor: "grab", padding: 12 }}
              >
                <div style={{ fontWeight: 800 }}>{p.title}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{p.hint}</div>
              </div>
            ))}
          </div>

          <div style={{ height: 14 }} />

          <div className="card" style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800 }}>Actions</div>
            <button
              className="btn"
              disabled={!workflow || saving}
              onClick={async () => {
                if (!workflow) return;
                setSaving(true);
                try {
                  await fetch(`/api/workflows/${workflow.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ownerEmail: email,
                      name: workflow.name,
                      json: { nodes, edges },
                    }),
                  });
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              className="btn secondary"
              disabled={!workflow}
              onClick={async () => {
                if (!workflow) return;
                const res = await fetch(`/api/webhook/${workflow.id}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ hello: "world" }),
                });
                const data = await res.json();
                setLastRunId(data.runId ?? null);
              }}
            >
              Trigger test webhook
            </button>

            {lastRunId ? (
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Last run:{" "}
                <a
                  href="#"
                  onClick={async (e) => {
                    e.preventDefault();
                    const res = await fetch(`/api/runs/${lastRunId}`);
                    const data = await res.json();
                    alert(JSON.stringify(data, null, 2));
                  }}
                >
                  #{lastRunId} (click to view JSON)
                </a>
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onInit={setRf}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

