# WFAIB Architecture

## System Overview

WFAIB (Workflow + AI Automation Platform) is a prototype for building visual, event-driven automation workflows with AI integration.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Dashboard  │  │   Editor    │  │     Run Viewer          │  │
│  │  (List)     │  │ (React Flow)│  │     (Logs)              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │/workflows│  │/webhook  │  │  /runs   │  │   /auth          │ │
│  │  CRUD    │  │ Trigger  │  │  Queue   │  │   (Stub)         │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Execution Layer                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Executor                                  ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ ││
│  │  │ Webhook │  │  HTTP   │  │   LLM   │  │    Transform    │ ││
│  │  │  Node   │  │  Node   │  │  Node   │  │      Node       │ ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   PostgreSQL    │  │     Redis       │  │  External APIs  │  │
│  │   (Prisma)      │  │   (Future)      │  │   (HTTP/LLM)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend

**Technology:** Next.js 14, React 18, React Flow, TypeScript

**Pages:**
- `/` - Dashboard with workflow list
- `/workflows/new` - Create new workflow
- `/workflows/[id]` - Edit workflow
- `/workflows/[id]/runs` - View runs for workflow
- `/runs/[id]` - View run details with logs
- `/login` - Auth stub (email only)

**Workflow Editor:**
- Drag-and-drop node palette
- React Flow canvas for visual editing
- Properties panel for node configuration
- Save/load workflow definitions

### 2. API Layer

**Technology:** Next.js API Routes

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows` | List workflows |
| GET | `/api/workflows/:id` | Get workflow |
| PUT | `/api/workflows/:id` | Update workflow |
| DELETE | `/api/workflows/:id` | Delete workflow |
| POST | `/api/webhook/:workflowId` | Trigger workflow (sync) |
| POST | `/api/runs/:workflowId` | Queue run (stub) |
| GET | `/api/runs/:runId` | Get run with logs |
| POST | `/api/auth/login` | Auth stub |

### 3. Execution Engine

**Location:** `src/worker/executor.ts`

**Workflow Execution Flow:**
1. Receive trigger (webhook payload or manual)
2. Create Run record in database
3. Build execution order (topological sort)
4. Execute nodes sequentially
5. Log each node's input/output to RunLog
6. Update Run status on completion/failure

**Node Types:**

| Type | Description | Config |
|------|-------------|--------|
| `webhook` | Trigger entry point | - |
| `http` | External API calls | `url`, `method`, `headers` |
| `llm` | AI completion | `prompt`, `model`, `temperature` |
| `transform` | Data transformation | `mapping`, `expression` |

### 4. Data Model

```prisma
model User {
  id        Int        @id @default(autoincrement())
  email     String     @unique
  workflows Workflow[]
}

model Workflow {
  id        Int      @id
  name      String
  ownerId   Int
  json      Json     // WorkflowDefinition
  runs      Run[]
}

model Run {
  id         Int       @id
  workflowId Int
  status     String    // pending, running, completed, failed
  input      Json?
  result     Json?
  logs       RunLog[]
}

model RunLog {
  id        Int     @id
  runId     Int
  nodeId    String
  nodeType  String
  status    String  // started, completed, failed
  input     Json?
  output    Json?
  error     String?
  duration  Int?    // ms
}
```

### 5. Workflow Definition Schema

```typescript
interface WorkflowDefinition {
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

interface WorkflowNode {
  id: string
  type: 'webhook' | 'http' | 'llm' | 'transform'
  config: NodeConfig
  position?: { x: number; y: number }
}

interface WorkflowEdge {
  from: string
  to: string
}
```

## Security Considerations

### Current (Prototype)

⚠️ **Not production-ready**

- No authentication enforcement
- Transform node expressions are not sandboxed
- No rate limiting
- No input validation beyond basic checks

### TODO for Production

1. **Authentication**
   - Implement NextAuth.js with JWT
   - Add OAuth providers (Google, GitHub)
   - Session management

2. **Sandboxing**
   - Use `isolated-vm` or `vm2` for Transform nodes
   - WebAssembly-based sandbox for untrusted code
   - Resource limits (CPU, memory, time)

3. **API Security**
   - Rate limiting per user/IP
   - Webhook signature verification
   - Input sanitization
   - CORS configuration

4. **Data Security**
   - Encrypt sensitive config values
   - Audit logging
   - Secret management (vault integration)

## Phase 2 Roadmap

### Async Job Processing

Replace synchronous execution with durable job queue:

```
Option A: BullMQ
- Redis-based queue
- Simple to implement
- Good for most use cases

Option B: Temporal
- Durable execution
- Built-in retry/timeout
- Better for long-running workflows
```

### Enhanced Node Types

- **Conditional** - If/else branching
- **Loop** - Iterate over arrays
- **Delay** - Wait/sleep
- **Code** - Custom JavaScript (sandboxed)
- **Email** - Send emails
- **Database** - Query databases
- **Storage** - File upload/download

### Real LLM Integration

```typescript
// lib/llm.ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function executeLLM(config: LLMConfig): Promise<LLMResponse> {
  const response = await openai.chat.completions.create({
    model: config.model || 'gpt-4',
    messages: [{ role: 'user', content: config.prompt }],
    max_tokens: config.maxTokens,
    temperature: config.temperature,
  })
  
  return {
    content: response.choices[0].message.content,
    usage: response.usage,
  }
}
```

### UI Enhancements

- Workflow templates
- Node search/filter
- Keyboard shortcuts
- Undo/redo
- Collaboration (real-time editing)
- Dark/light theme toggle
- Mobile responsive

### Monitoring & Observability

- OpenTelemetry integration
- Prometheus metrics
- Grafana dashboards
- Error tracking (Sentry)
- Performance profiling

## Deployment Options

### Docker Compose (Development)

```bash
docker-compose up -d
```

### Kubernetes (Production)

- Helm charts for deployment
- Horizontal pod autoscaling
- Ingress with TLS
- PersistentVolumeClaims for data

### Serverless (Alternative)

- Vercel for Next.js app
- Supabase for PostgreSQL
- Upstash for Redis
- Trigger.dev for background jobs

## Testing Strategy

| Level | Tool | Coverage |
|-------|------|----------|
| Unit | Jest | Executor, LLM, nodes |
| Integration | Jest + SuperTest | API endpoints |
| E2E | Playwright | UI workflows |
| Load | k6 | Webhook throughput |

## Contributing

1. Fork the repository
2. Create feature branch
3. Write tests
4. Submit PR with description

## Next Steps PRs

1. **PR: Authentication** - Implement NextAuth.js with email/password
2. **PR: BullMQ Integration** - Add async job queue for runs
3. **PR: Conditional Node** - Add if/else branching logic
4. **PR: Transform Sandbox** - Secure code execution
5. **PR: Webhook Security** - Signature verification + rate limiting
6. **PR: Real LLM** - OpenAI/Anthropic integration with streaming
7. **PR: E2E Tests** - Playwright test suite
8. **PR: Monitoring** - OpenTelemetry + dashboards
