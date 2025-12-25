import { PrismaClient, Workflow } from "@prisma/client";
import { callLlm } from "@/lib/llm";
import { WorkflowJsonSchema, WorkflowNode } from "@/lib/workflowTypes";

export type ExecuteOptions = {
  prisma: PrismaClient;
  runId?: number;
};

function topoSort(nodes: WorkflowNode[], edges: Array<{ source: string; target: string }>) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const out = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    out.set(n.id, []);
  }
  for (const e of edges) {
    if (!byId.has(e.source) || !byId.has(e.target)) continue;
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    out.get(e.source)?.push(e.target);
  }

  const q: string[] = [];
  for (const [id, deg] of inDegree.entries()) if (deg === 0) q.push(id);

  const ordered: WorkflowNode[] = [];
  while (q.length) {
    const id = q.shift()!;
    const n = byId.get(id);
    if (!n) continue;
    ordered.push(n);
    for (const t of out.get(id) ?? []) {
      inDegree.set(t, (inDegree.get(t) ?? 0) - 1);
      if ((inDegree.get(t) ?? 0) === 0) q.push(t);
    }
  }

  // If graph has cycles, fall back to input order (still deterministic).
  return ordered.length === nodes.length ? ordered : nodes;
}

function incomingSources(edges: Array<{ source: string; target: string }>) {
  const map = new Map<string, string[]>();
  for (const e of edges) {
    const list = map.get(e.target) ?? [];
    list.push(e.source);
    map.set(e.target, list);
  }
  return map;
}

async function runNode(node: WorkflowNode, input: unknown) {
  const data: any = node.data ?? {};
  switch (node.type) {
    case "webhook":
      return input;
    case "transform": {
      const expr = String(data.expr ?? "({ ...input })");
      // TODO(security): this is UNSAFE for untrusted users. Replace with sandboxing.
      // eslint-disable-next-line no-new-func
      const fn = new Function("input", `return (${expr});`) as (input: unknown) => unknown;
      return fn(input);
    }
    case "llm": {
      const prompt = String(data.prompt ?? "Summarize input.");
      return await callLlm({ prompt, input });
    }
    case "http": {
      const url = String(data.url ?? "");
      if (!url) throw new Error(`HTTP node '${node.id}' missing url`);
      const method = String(data.method ?? "POST").toUpperCase();
      const headers: Record<string, string> = { "content-type": "application/json" };
      const body =
        method === "GET" || method === "HEAD" ? undefined : JSON.stringify(input ?? {});
      const res = await fetch(url, { method, headers, body });
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      return { status: res.status, ok: res.ok, text, json };
    }
    default:
      throw new Error(`Unknown node type: ${(node as any).type}`);
  }
}

export async function executeWorkflow(
  workflow: Workflow,
  input: unknown,
  opts: ExecuteOptions
): Promise<{ runId: number; result: unknown }> {
  const prisma = opts.prisma;

  const parsed = WorkflowJsonSchema.safeParse(workflow.json);
  if (!parsed.success) throw new Error("Invalid workflow JSON");

  const wf = parsed.data;
  const edges = wf.edges.map((e) => ({ source: e.source, target: e.target }));
  const order = topoSort(wf.nodes, edges);
  const incoming = incomingSources(edges);

  const run =
    opts.runId != null
      ? await prisma.run.update({
          where: { id: opts.runId },
          data: { status: "running", input: input as any },
        })
      : await prisma.run.create({
          data: {
            workflowId: workflow.id,
            status: "running",
            input: input as any,
          },
        });

  const outputs = new Map<string, unknown>();
  let last: unknown = null;

  try {
    for (const node of order) {
      const sources = incoming.get(node.id) ?? [];
      const nodeInput =
        sources.length === 0
          ? input
          : sources.length === 1
            ? outputs.get(sources[0])
            : Object.fromEntries(sources.map((s) => [s, outputs.get(s)]));

      await prisma.runLog.create({
        data: {
          runId: run.id,
          nodeId: node.id,
          nodeType: node.type,
          level: "info",
          message: "start",
          output: { input: nodeInput } as any,
        },
      });

      const out = await runNode(node, nodeInput);
      outputs.set(node.id, out);
      last = out;

      await prisma.runLog.create({
        data: {
          runId: run.id,
          nodeId: node.id,
          nodeType: node.type,
          level: "info",
          message: "end",
          output: out as any,
        },
      });
    }

    await prisma.run.update({
      where: { id: run.id },
      data: { status: "succeeded", result: last as any },
    });
    return { runId: run.id, result: last };
  } catch (err: any) {
    await prisma.runLog.create({
      data: {
        runId: run.id,
        nodeId: "executor",
        nodeType: "system",
        level: "error",
        message: String(err?.message ?? err),
        output: { error: String(err?.message ?? err) } as any,
      },
    });
    await prisma.run.update({
      where: { id: run.id },
      data: { status: "failed", result: { error: String(err?.message ?? err) } as any },
    });
    throw err;
  }
}

