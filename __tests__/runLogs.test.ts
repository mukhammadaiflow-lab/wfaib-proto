/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db";
import { ensureDbSchema } from "@/tests/ensureDb";
import runsHandler from "@/pages/api/runs/[id]";
import { createMocks } from "node-mocks-http";

beforeAll(() => ensureDbSchema());

beforeEach(async () => {
  await prisma.runLog.deleteMany();
  await prisma.run.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.user.deleteMany();
});

test("GET /api/runs/:runId returns Run with RunLogs", async () => {
  const user = await prisma.user.create({ data: { email: "x@y.com" } });
  const workflow = await prisma.workflow.create({
    data: { name: "wf", ownerId: user.id, json: { nodes: [], edges: [] } },
  });
  const run = await prisma.run.create({
    data: { workflowId: workflow.id, status: "succeeded", result: { ok: true } as any },
  });
  await prisma.runLog.createMany({
    data: [
      {
        runId: run.id,
        nodeId: "n1",
        nodeType: "transform",
        level: "info",
        message: "hello",
        output: { a: 1 } as any,
      },
      {
        runId: run.id,
        nodeId: "n2",
        nodeType: "llm",
        level: "info",
        message: "world",
        output: { b: 2 } as any,
      },
    ],
  });

  const { req, res } = createMocks({ method: "GET", query: { id: String(run.id) } });
  await runsHandler(req as any, res as any);
  expect(res._getStatusCode()).toBe(200);
  const data = JSON.parse(res._getData());
  expect(data.run.id).toBe(run.id);
  expect(data.run.logs.length).toBe(2);
});

