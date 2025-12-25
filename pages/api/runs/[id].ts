import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { parseId } from "@/lib/apiUtils";
import { executeWorkflow } from "@/worker/executor";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseId(req.query.id);
  if (!id) {
    res.status(400).json({ error: "invalid id" });
    return;
  }

  if (req.method === "GET") {
    const run = await prisma.run.findUnique({
      where: { id },
      include: { logs: { orderBy: { createdAt: "asc" } } },
    });
    if (!run) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.status(200).json({ run });
    return;
  }

  if (req.method === "POST") {
    const workflowId = id;
    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) {
      res.status(404).json({ error: "workflow not found" });
      return;
    }

    const input = req.body ?? null;
    const run = await prisma.run.create({
      data: { workflowId, status: "queued", input: input as any },
    });

    // Queue stub: execute "later" in-process.
    // TODO(phase2): replace with BullMQ/Redis or Temporal.
    setImmediate(() => {
      executeWorkflow(workflow, input, { prisma, runId: run.id }).catch(() => {});
    });

    res.status(200).json({ runId: run.id, status: run.status });
    return;
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}

