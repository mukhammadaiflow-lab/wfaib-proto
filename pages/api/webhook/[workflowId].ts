import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { parseId } from "@/lib/apiUtils";
import { executeWorkflow } from "@/worker/executor";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const workflowId = parseId(req.query.workflowId);
  if (!workflowId) {
    res.status(400).json({ error: "invalid workflowId" });
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) {
    res.status(404).json({ error: "not found" });
    return;
  }

  const input = req.body ?? null;
  const { runId, result } = await executeWorkflow(workflow, input, { prisma });
  res.status(200).json({ runId, result });
}

