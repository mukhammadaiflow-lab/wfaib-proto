/**
 * @jest-environment node
 */
import healthHandler from "@/pages/api/health";
import { createMocks } from "node-mocks-http";

test("GET /api/health returns ok", async () => {
  const { req, res } = createMocks({ method: "GET" });
  await healthHandler(req as any, res as any);
  expect(res._getStatusCode()).toBe(200);
  const data = JSON.parse(res._getData());
  expect(data.ok).toBe(true);
});

