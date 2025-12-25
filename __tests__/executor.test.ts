/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db";
import { executeWorkflow } from "@/worker/executor";
import { ensureDbSchema } from "@/tests/ensureDb";

beforeAll(async () => {
  ensureDbSchema();
});

beforeEach(async () => {
  await prisma.runLog.deleteMany();
  await prisma.run.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.user.deleteMany();
});

test("executor runs nodes sequentially and writes RunLogs", async () => {
  const user = await prisma.user.create({ data: { email: "test@example.com" } });
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
            data: { expr: "({ ...input, added: 123 })" },
          },
          {
            id: "llm-1",
            type: "llm",
            position: { x: 2, y: 0 },
            data: { prompt: "Echo" },
          },
        ],
        edges: [
          { source: "webhook-1", target: "transform-1" },
          { source: "transform-1", target: "llm-1" },
        ],
      },
    },
  });

  const { runId, result } = await executeWorkflow(workflow, { foo: "bar" }, { prisma });

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { logs: { orderBy: { createdAt: "asc" } } },
  });
  expect(run).toBeTruthy();
  expect(run?.status).toBe("succeeded");
  expect(run?.logs.length).toBeGreaterThanOrEqual(4); // start/end per node
  expect(result).toBeTruthy();
});

