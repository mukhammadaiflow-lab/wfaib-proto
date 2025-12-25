# wfaib-proto (Day-0 scaffold)

Workflow + AI automation platform prototype inspired by the *idea* of tools like n8n/Zapier (original implementation).

## Quickstart (docker)

```bash
cp .env.example .env
docker-compose up --build
```

Then open `http://localhost:3000`.

## Local dev (without docker)

Requires Postgres + Redis.

```bash
npm install
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wfaib"
export REDIS_URL="redis://localhost:6379"
npx prisma generate
npx prisma db push --accept-data-loss
npm run dev
```

## Core API

### Health

```bash
curl -s http://localhost:3000/api/health | jq
```

### Create a workflow

```bash
curl -s -X POST http://localhost:3000/api/workflows \
  -H 'content-type: application/json' \
  -d '{
    "ownerEmail":"demo@example.com",
    "name":"hello",
    "json":{
      "nodes":[
        {"id":"webhook-1","type":"webhook","position":{"x":0,"y":0},"data":{}},
        {"id":"transform-1","type":"transform","position":{"x":200,"y":0},"data":{"expr":"({ ...input, ok: true })"}}
      ],
      "edges":[{"source":"webhook-1","target":"transform-1"}]
    }
  }' | jq
```

### Trigger via webhook (synchronous prototype)

```bash
curl -s -X POST http://localhost:3000/api/webhook/1 \
  -H 'content-type: application/json' \
  -d '{"hello":"world"}' | jq
```

### Get run + logs

```bash
curl -s http://localhost:3000/api/runs/1 | jq
```

## Testing

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wfaib"
npm test
```

## Acceptance criteria checklist

- `docker-compose up --build` boots and Next.js responds on `:3000`
- `POST /api/workflows` creates a workflow row
- `POST /api/webhook/:workflowId` returns `{ runId }` and executes nodes
- `GET /api/runs/:runId` returns `Run` with `RunLog[]` entries per node

## Security / Phase 2 TODOs

- **Transform sandboxing**: current `Transform` uses `new Function(...)` (unsafe).
- **Auth**: email-only localStorage stub, no ownership enforcement.
- **Queueing**: `/api/runs/:workflowId` uses an in-process `setImmediate` stub.
- **Secrets**: no vault for API keys; LLM is mock by default.
