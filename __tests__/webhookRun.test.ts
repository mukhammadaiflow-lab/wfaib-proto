/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db";
import { ensureDbSchema } from "@/tests/ensureDb";
import webhookHandler from "@/pages/api/webhook/[workflowId]";
import { createMocks } from "node-mocks-http";

beforeAll(() => ensureDbSchema());

beforeEach(async () => {
  await prisma.runLog.deleteMany();
  await prisma.run.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.user.deleteMany();
});

test("POST /api/webhook/:workflowId returns runId and persists logs", async () => {
  const user = await prisma.user.create({ data: { email: "a@b.com" } });
  const workflow = await prisma.workflow.create({
    data: {
      name: "wf",
      ownerId: user.id,
      json: {
        nodes: [
          { id: "webhook-1", type: "webhook", position: { x: 0, y: 0 }, data: {} },
          {
            id: "transform-1",
            type: "transform",
            position: { x: 1, y: 0 },
            data: { expr: "({ ...input, ok: true })" },
          },
        ],
        edges: [{ source: "webhook-1", target: "transform-1" }],
      },
    },
  });

  const { req, res } = createMocks({
    method: "POST",
    query: { workflowId: String(workflow.id) },
    body: { hello: "world" },
  });

  await webhookHandler(req as any, res as any);

  expect(res._getStatusCode()).toBe(200);
  const data = JSON.parse(res._getData());
  expect(data.runId).toBeTruthy();

  const run = await prisma.run.findUnique({
    where: { id: data.runId },
    include: { logs: true },
  });
  expect(run?.logs.length).toBeGreaterThanOrEqual(2);
});

