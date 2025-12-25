import Link from "next/link";
import { useEffect, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { useRequireAuth } from "@/lib/auth";

type WorkflowListItem = {
  id: number;
  name: string;
  createdAt: string;
};

export default function DashboardPage() {
  const { email } = useRequireAuth();
  const [items, setItems] = useState<WorkflowListItem[]>([]);
  const [name, setName] = useState("My workflow");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!email) return;
    fetch(`/api/workflows?ownerEmail=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => setItems(data.workflows ?? []))
      .catch(() => setItems([]));
  }, [email]);

  if (!email) return null;

  return (
    <div>
      <NavBar />
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: 6 }}>Workflows</h1>
            <div style={{ opacity: 0.75 }}>
              Day-0 prototype: build, trigger, and inspect synchronous runs.
            </div>
          </div>
          <div className="row">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: 280 }}
              aria-label="workflow-name"
            />
            <button
              className="btn"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const res = await fetch("/api/workflows", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ownerEmail: email,
                      name: name.trim() || "Untitled workflow",
                      json: {
                        nodes: [
                          {
                            id: "webhook-1",
                            type: "webhook",
                            position: { x: 80, y: 120 },
                            data: { label: "Webhook" },
                          },
                          {
                            id: "transform-1",
                            type: "transform",
                            position: { x: 360, y: 120 },
                            data: { label: "Transform", expr: "({ ...input, ok: true })" },
                          },
                        ],
                        edges: [
                          {
                            id: "e1",
                            source: "webhook-1",
                            target: "transform-1",
                          },
                        ],
                      },
                    }),
                  });
                  const data = await res.json();
                  if (data?.id) {
                    window.location.href = `/workflows/${data.id}/edit`;
                  }
                } finally {
                  setBusy(false);
                }
              }}
            >
              New workflow
            </button>
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {items.map((wf) => (
            <div className="card" key={wf.id}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{wf.name}</div>
                  <div style={{ opacity: 0.7, fontSize: 13 }}>
                    Created {new Date(wf.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="row">
                  <Link className="btn secondary" href={`/workflows/${wf.id}/edit`}>
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 ? (
            <div className="card" style={{ opacity: 0.8 }}>
              No workflows yet. Create one to get started.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

