# Architecture (Day-0)

## High-level

- **Frontend**: Next.js (Pages Router) + TypeScript
  - Dashboard: `/` lists workflows for the signed-in email
  - Editor: `/workflows/[id]/edit` uses React Flow and saves workflow JSON
  - Auth (stub): email stored in `localStorage` (no real session)

- **Backend**: Next.js API routes
  - Workflows: `/api/workflows`, `/api/workflows/:id`
  - Runs: `/api/webhook/:workflowId` (sync), `/api/runs/:id` (GET runId, POST workflowId)

- **Storage**: Postgres via Prisma
  - `Workflow.json` holds `{ nodes, edges }` (React Flow-ish schema)
  - `Run` stores `status`, `input`, `result`
  - `RunLog` stores node-level start/end events + outputs

- **Executor**: `worker/executor.ts`
  - Builds a simple topological order from edges
  - Passes outputs forward node-by-node
  - Writes `RunLog` rows for `start` and `end` per node

## Node execution model

- **webhook**: pass-through input
- **transform**: evaluates a JS expression (unsafe; sandbox in Phase 2)
- **llm**: calls `lib/llm.ts` (mock mode by default)
- **http**: performs `fetch()` and returns `{status, ok, text, json}`

## Key limitations (intentional for Day-0)

- No multi-tenant auth/authorization enforcement
- No sandboxing / isolation for user-provided code
- No durable queue: `/api/runs/:workflowId` is a stub (in-process scheduling)

## Next-step PR ideas

- Replace auth stub with real sessions (NextAuth/Auth.js) + workflow ownership checks
- BullMQ + Redis (or Temporal) worker for durable runs; retry/backoff; concurrency limits
- Secure sandbox for transforms (vm2/isolated-vm/firecracker) + resource/time caps
- Workflow validation (no cycles, required fields) + richer node configs (headers, templating)
- Observability: structured logs, trace IDs, run timeline UI

