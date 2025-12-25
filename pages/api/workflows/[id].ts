import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { parseId } from "@/lib/apiUtils";
import { WorkflowJsonSchema } from "@/lib/workflowTypes";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseId(req.query.id);
  if (!id) {
    res.status(400).json({ error: "invalid id" });
    return;
  }

  if (req.method === "GET") {
    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.status(200).json({ workflow });
    return;
  }

  if (req.method === "PUT") {
    const { ownerEmail, name, json } = req.body ?? {};
    if (!ownerEmail || typeof ownerEmail !== "string") {
      res.status(400).json({ error: "ownerEmail required" });
      return;
    }
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "name required" });
      return;
    }
    const parsed = WorkflowJsonSchema.safeParse(json);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid workflow json" });
      return;
    }
    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) {
      res.status(404).json({ error: "not found" });
      return;
    }
    // TODO(security): authorize ownership using real auth/session.
    const updated = await prisma.workflow.update({
      where: { id },
      data: { name, json: parsed.data as any },
    });
    res.status(200).json({ workflow: updated });
    return;
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}

