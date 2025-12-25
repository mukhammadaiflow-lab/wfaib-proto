# Cursor generation job: WFAIB Day-0 scaffold

Project name: wfaib-proto
Goal: Generate a runnable Day-0 scaffold for a workflow + AI automation platform (prototype). Reimplement ideas from n8n/Zapier but use original code. Output files and commit them.

Phase 1 requirements (deliver in `prototype` branch):
1) Frontend (Next.js + TypeScript)
   - Workflow editor page using React Flow with drag/drop, node palette (Webhook, HTTP, LLM mock, Transform)
   - Dashboard list of workflows
   - Simple auth stub (email-only)

2) Backend (Next.js API routes or Express with TypeScript)
   - Endpoints:
     - POST /api/workflows  (create workflow JSON)
     - GET /api/workflows/:id
     - POST /api/webhook/:workflowId  (synchronous prototype)
     - POST /api/runs/:workflowId  (queue stub)
     - GET /api/runs/:runId
   - Persist with Prisma + Postgres (use prisma/schema.prisma present)

3) Executor
   - worker/executor.ts with executeWorkflow(workflow, input) that runs nodes sequentially and writes Run + RunLog rows
   - lib/llm.ts with mockMode=true default

4) Dev infra
   - Dockerfile + docker-compose.yml (already seeded). Ensure `docker-compose up` starts app + postgres + redis

5) Tests + CI
   - 5 Jest tests: executor, webhook run, run logs, api health, basic UI render
   - GitHub Actions ci.yml

6) README: run steps, curl examples, acceptance criteria

Constraints & notes:
- Do not copy code from n8n/zapier or any paid course; reimplement functionality.
- Add TODO comments for security (sandboxing) and for Phase 2 (BullMQ/Temporal).
- Structure commits: frontend, backend+prisma, executor+tests, docker+ci.

Acceptance criteria:
- `docker-compose up` boots (app responds).
- POST /api/workflows, then POST /api/webhook/:id returns runId.
- GET /api/runs/:runId returns RunLogs per node.

Deliver a clean commit history in branch `prototype`. Provide short architecture.md and a list of next-step PRs.

