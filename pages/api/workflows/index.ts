import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { WorkflowJsonSchema } from "@/lib/workflowTypes";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const ownerEmail = String(req.query.ownerEmail ?? "");
    if (!ownerEmail) {
      res.status(400).json({ error: "ownerEmail required" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (!user) {
      res.status(200).json({ workflows: [] });
      return;
    }
    const workflows = await prisma.workflow.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    });
    res.status(200).json({ workflows });
    return;
  }

  if (req.method === "POST") {
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

    const user = await prisma.user.upsert({
      where: { email: ownerEmail },
      create: { email: ownerEmail },
      update: {},
    });

    const workflow = await prisma.workflow.create({
      data: {
        name,
        ownerId: user.id,
        json: parsed.data as any,
      },
      select: { id: true, name: true, createdAt: true },
    });

    res.status(200).json(workflow);
    return;
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}

