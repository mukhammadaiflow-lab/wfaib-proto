import { z } from "zod";

export const WorkflowNodeType = z.enum(["webhook", "http", "llm", "transform"]);

export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: WorkflowNodeType,
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.string(), z.any()).optional(),
});

export const WorkflowEdgeSchema = z.object({
  id: z.string().optional(),
  source: z.string(),
  target: z.string(),
});

export const WorkflowJsonSchema = z.object({
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
});

export type WorkflowJson = z.infer<typeof WorkflowJsonSchema>;
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;

