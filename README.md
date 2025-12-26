# WFAIB Proto

**Workflow + AI Automation Platform Prototype**

A Day-0 scaffold for a workflow automation platform inspired by n8n/Zapier, with AI integration capabilities. This prototype demonstrates core concepts for building visual workflow editors with backend execution.

## Features

- 🎨 **Visual Workflow Editor** - Drag-and-drop interface built with React Flow
- 🔗 **Webhook Triggers** - HTTP webhook endpoints to trigger workflows
- 🌐 **HTTP Nodes** - Make external API calls
- 🤖 **LLM Nodes** - AI completion with mock mode (OpenAI ready)
- ⚡ **Transform Nodes** - Data transformation and mapping
- 📊 **Run History** - View execution logs per node
- 🗄️ **Persistent Storage** - PostgreSQL with Prisma ORM

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

### Using Docker (Recommended)

```bash
# Clone and start services
git clone <repo-url>
cd wfaib-proto

# Start all services
docker-compose up -d

# Wait for services to be ready, then run migrations
docker-compose run --rm migrate

# The app is now available at http://localhost:3000
```

### Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start PostgreSQL (via Docker or local)
docker-compose up -d postgres redis

# Run database migrations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wfaib" npx prisma migrate dev

# Start development server
npm run dev
```

## API Examples

### Create a Workflow

```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Workflow",
    "json": {
      "name": "My First Workflow",
      "nodes": [
        { "id": "webhook1", "type": "webhook", "config": {} },
        { "id": "http1", "type": "http", "config": { "url": "https://httpbin.org/post", "method": "POST" } },
        { "id": "llm1", "type": "llm", "config": { "prompt": "Summarize this data" } }
      ],
      "edges": [
        { "from": "webhook1", "to": "http1" },
        { "from": "http1", "to": "llm1" }
      ]
    }
  }'
```

Response:
```json
{
  "id": 1,
  "name": "My First Workflow",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Workflow

```bash
curl http://localhost:3000/api/workflows/1
```

### Trigger Workflow via Webhook

```bash
curl -X POST http://localhost:3000/api/webhook/1 \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from webhook!", "data": {"key": "value"}}'
```

Response:
```json
{
  "runId": 1,
  "workflowId": 1,
  "status": "completed",
  "success": true,
  "result": { ... },
  "logsCount": 3
}
```

### Queue a Run (Async Stub)

```bash
curl -X POST http://localhost:3000/api/runs/1 \
  -H "Content-Type: application/json" \
  -d '{"input": {"foo": "bar"}}'
```

### Get Run Details with Logs

```bash
curl http://localhost:3000/api/runs/1
```

Response:
```json
{
  "id": 1,
  "workflowId": 1,
  "workflowName": "My First Workflow",
  "status": "completed",
  "logs": [
    {
      "nodeId": "webhook1",
      "nodeType": "webhook",
      "status": "completed",
      "duration": 5,
      "output": { ... }
    },
    ...
  ]
}
```

### Health Check

```bash
curl http://localhost:3000/api/health
```

## Project Structure

```
wfaib-proto/
├── src/
│   ├── components/       # React components
│   │   ├── Layout.tsx
│   │   ├── WorkflowEditor.tsx
│   │   └── nodes/        # Custom React Flow nodes
│   ├── lib/
│   │   ├── prisma.ts     # Database client
│   │   └── llm.ts        # LLM integration (mock mode)
│   ├── pages/
│   │   ├── api/          # API routes
│   │   │   ├── health.ts
│   │   │   ├── workflows/
│   │   │   ├── webhook/
│   │   │   ├── runs/
│   │   │   └── auth/
│   │   ├── index.tsx     # Dashboard
│   │   ├── login.tsx
│   │   ├── workflows/
│   │   └── runs/
│   ├── styles/
│   ├── types/
│   │   └── workflow.ts   # TypeScript interfaces
│   ├── worker/
│   │   └── executor.ts   # Workflow execution engine
│   └── __tests__/        # Jest tests
├── prisma/
│   └── schema.prisma     # Database schema
├── docker-compose.yml
├── Dockerfile
└── architecture.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `OPENAI_API_KEY` | OpenAI API key (optional) | - |
| `LLM_MOCK_MODE` | Use mock LLM responses | `true` |
| `NODE_ENV` | Environment mode | `development` |

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## Acceptance Criteria ✅

- [x] `docker-compose up` boots (app responds at :3000)
- [x] `POST /api/workflows` creates workflow and returns ID
- [x] `POST /api/webhook/:id` triggers execution and returns runId
- [x] `GET /api/runs/:runId` returns RunLogs per node

## Architecture

See [architecture.md](./architecture.md) for detailed system design.

## Phase 2 Roadmap

See [architecture.md](./architecture.md#phase-2-roadmap) for planned enhancements:

- [ ] BullMQ/Temporal for async job processing
- [ ] Real LLM integration (OpenAI, Anthropic)
- [ ] Transform node sandboxing (vm2/isolated-vm)
- [ ] NextAuth.js authentication
- [ ] Webhook signature verification
- [ ] Rate limiting & circuit breakers

## License

MIT License - See [LICENSE](./LICENSE)
