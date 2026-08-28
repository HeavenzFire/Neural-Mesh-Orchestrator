# Neural Mesh Orchestrator & Capability Cortex

A distributed neural mesh orchestration platform featuring a 256-node repository, dynamic capability registry, pathway routing engine, real-time axon message bus, AI-powered optimization, and deep observability.

![Status](https://img.shields.io/badge/status-production--ready-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.8-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

## 🌐 Architecture Overview

The Neural Mesh Orchestrator implements a **biologically-inspired distributed architecture** where autonomous computational units (neurons) organize into functional domains, communicate via signal pathways (axons), and self-heal through circuit-breaker patterns and failover routing.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEURAL MESH CORTEX REGISTRY                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ ORCHESTRATION│  │  GENERATION  │  │   CODECRAFT  │  ... 10 DOMAINS  │
│  │    Domain    │  │    Domain    │  │    Domain    │                  │
│  │  [25 neurons]│  │  [26 neurons]│  │  [25 neurons]│                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                 │                           │
│         └─────────────────┴─────────────────┘                           │
│                       PATHWAY ROUTING ENGINE                            │
│         ┌─────────────────┬─────────────────┐                           │
│         │                 │                 │                           │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐                  │
│  │ AXON MESSAGE │  │   FAILSAFE   │  │   METRICS &  │                  │
│  │     BUS      │  │   ROUTING    │  │ OBSERVABILITY│                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Description |
|-----------|-------------|
| **Neuron Registry** | Dynamic registration/discovery of 256 repository nodes across 10 functional domains |
| **Pathway Engine** | Multi-hop execution pipelines with configurable routing policies (least_latency, weighted_health, failover_priority) |
| **Axon Message Bus** | Real-time signal routing with trace IDs, hop counting, and event streaming |
| **Circuit Breaker** | Automatic failure isolation and recovery with configurable thresholds |
| **AI Optimizer** | Gemini-powered pathway synthesis and optimization recommendations |
| **Observability Stack** | Metrics trends, alerting system, audit logs, and telemetry export |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- (Optional) Google Cloud API key for AI optimization features

### Installation

```bash
# Clone the repository
git clone https://github.com/HeavenzFire/Neural-Mesh-Orchestrator.git
cd Neural-Mesh-Orchestrator

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY if using AI optimization

# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

The server will start on `http://localhost:3000`.

---

## 🧠 Core Concepts

### Neurons

A **Neuron** is an autonomous computational unit registered in the mesh cortex. Each neuron exposes capabilities, declares dependencies, and reports health metrics.

**Neuron Manifest Schema:**

```typescript
interface NeuronManifest {
  id: string;                    // Unique identifier
  version: string;               // Semver version
  domain: DomainType;            // Functional domain (see taxonomy below)
  entrypoint: string;            // API endpoint or module path
  capabilities: string[];        // Exposed capabilities
  dependencies: string[];        // Dependent neuron IDs
  metadata?: {
    author?: string;
    mesh_branch: string;         // Git branch for sync
    replicas?: number;
    tags?: string[];
    description?: string;
  };
}
```

**Neuron Status States:**

| Status | Description |
|--------|-------------|
| `online` | Fully operational, accepting requests |
| `degraded` | Operational but experiencing elevated latency/errors |
| `offline` | Unreachable, circuit breaker tripped |
| `failover_standby` | Hot standby ready to assume failed node's load |

### Pathways

A **Pathway** is a multi-step execution pipeline threading through multiple neurons. Pathways define ordered steps, routing policies, and fallback strategies.

**Example Pathway:**

```json
{
  "id": "orchestrated-lattice-build",
  "name": "Orchestrated Lattice Build",
  "description": "Multi-repo synthesis chain",
  "steps": [
    { "neuronId": "entangled-multimodal-system-3", "capability": "route", "timeout_ms": 120 },
    { "neuronId": "iben-genesis", "capability": "generate", "fallbackNeuronId": "lattice-synth-01", "timeout_ms": 350 },
    { "neuronId": "codecraft-engine", "capability": "execute", "fallbackNeuronId": "code-loom-01", "timeout_ms": 200 },
    { "neuronId": "eval-critic-sentinel", "capability": "evaluate", "timeout_ms": 150 }
  ],
  "routing_policy": "least_latency",
  "tags": ["synthesis", "production", "verified"]
}
```

**Routing Policies:**

| Policy | Behavior |
|--------|----------|
| `least_latency` | Selects path with minimum cumulative latency |
| `round_robin` | Distributes load evenly across available nodes |
| `weighted_health` | Prioritizes nodes with highest health scores |
| `failover_priority` | Uses primary node, cascades to fallbacks on failure |

### Axon Signals

The **Axon Message Bus** routes signals between neurons. Each signal includes:

- `source` / `target`: Neuron IDs
- `signal_type`: request, response, heartbeat, alert, handshake, failover_trigger, sync
- `payload`: Arbitrary data payload
- `trace_id`: Distributed tracing identifier
- `hop_count`: Number of hops traversed

---

## 📡 API Reference

### Health & Discovery

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Service health check |
| `/api/neurons` | GET | List all neurons (supports filters: `domain`, `capability`, `status`, `search`) |
| `/api/neurons/:id` | GET | Get single neuron details |
| `/api/neurons/:id` | DELETE | Deregister a neuron |
| `/api/register` | POST | Register new neuron |
| `/api/handshake` | POST/PATCH | Update neuron health status |

### Pathway Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pathways` | GET | List all pathways |
| `/api/pathways/:id` | GET | Get pathway definition |
| `/api/pathways` | POST | Create new pathway |
| `/api/pathways/:id` | DELETE | Delete pathway |
| `/api/pathways/execute` | POST | Execute pathway with payload |
| `/api/pathways/history` | GET | View execution history |

### Messaging & Signals

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/signal` | POST | Emit signal to axon bus |
| `/api/bus/events` | GET | Stream recent events (supports `limit`, `type`, `trace_id` filters) |

### Observability

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/metrics/overview` | GET | Current mesh metrics snapshot |
| `/api/metrics/trends` | GET | 24-hour metric trends |
| `/api/alerts` | GET | Active alerts |
| `/api/alerts/:id/ack` | POST | Acknowledge alert |
| `/api/audit-logs` | GET | Security audit trail |

### Advanced Features

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/neurons/:id/toggle-failure` | POST | Simulate node failure (chaos engineering) |
| `/api/simulate-burst` | POST | Simulate traffic surge |
| `/api/ai/optimize-pathway` | POST | AI-powered pathway optimization |
| `/api/export?format=json\|csv` | GET | Export mesh configuration |

---

## 🗂️ Domain Taxonomy

The mesh organizes neurons into **10 functional domains**:

| Domain | Purpose | Example Capabilities |
|--------|---------|---------------------|
| `orchestration` | Workflow coordination, routing | route, compose, dispatch |
| `generation` | Content/text/code generation | generate, synthesize, expand |
| `codecraft` | Code transformation, AST operations | ast_transform, refactor, lint |
| `inference` | ML inference, embeddings | infer_batch, query_embeddings |
| `storage` | Persistence, caching | store, retrieve, cache_invalidate |
| `evaluation` | Quality assessment, validation | evaluate, truth_verify, loss_audit |
| `agentics` | Autonomous agent coordination | plan, execute_tool, memory_recall |
| `security` | Authentication, policy enforcement | authenticate, authorize, audit |
| `interface` | UI/UX rendering, visualization | render, stream_ui, visualize |
| `analytics` | Metrics, telemetry, insights | aggregate, trend_analysis, forecast |

---

## 🔧 Usage Examples

### Register a Neuron

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "manifest": {
      "id": "custom-analyzer-01",
      "version": "1.0.0",
      "domain": "analytics",
      "entrypoint": "/api/v1/analyze",
      "capabilities": ["trend_analysis", "anomaly_detection"],
      "dependencies": ["vector-vault-lake"],
      "metadata": {
        "author": "DataTeam",
        "mesh_branch": "main",
        "description": "Real-time anomaly detection engine"
      }
    },
    "status": "online"
  }'
```

### Execute a Pathway

```bash
curl -X POST http://localhost:3000/api/pathways/execute \
  -H "Content-Type: application/json" \
  -d '{
    "pathway_id": "orchestrated-lattice-build",
    "payload": {
      "prompt": "Generate optimized React component",
      "context": { "framework": "react", "style": "tailwind" }
    }
  }'
```

### Query Neurons by Domain

```bash
# Get all codecraft neurons
curl "http://localhost:3000/api/neurons?domain=codecraft"

# Search by capability
curl "http://localhost:3000/api/neurons?capability=ast_transform"

# Find degraded nodes
curl "http://localhost:3000/api/neurons?status=degraded"
```

### Stream Axon Events

```bash
# Get last 100 heartbeat signals
curl "http://localhost:3000/api/bus/events?limit=100&type=heartbeat"

# Filter by trace ID
curl "http://localhost:3000/api/bus/events?trace_id=sig-abc123"
```

### AI Pathway Optimization

```bash
curl -X POST http://localhost:3000/api/ai/optimize-pathway \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Minimize latency for real-time inference pipeline",
    "pathway_id": "fast-speculative-infer-chain"
  }'
```

---

## 🛠️ Extension Guide

### Adding Custom Neurons

1. Create a neuron manifest JSON following the schema above
2. POST to `/api/register` with your manifest
3. Implement health handshakes via `/api/handshake`
4. Declare dependencies to enable automatic pathway weaving

### Creating Custom Pathways

```typescript
const customPathway = {
  id: "my-custom-pipeline",
  name: "Custom Data Pipeline",
  description: "Processes incoming data through validation and enrichment",
  steps: [
    { neuronId: "validator-node-01", capability: "validate_schema", timeout_ms: 50 },
    { neuronId: "enricher-node-02", capability: "enrich_data", fallbackNeuronId: "backup-enricher", timeout_ms: 120 },
    { neuronId: "storage-node-03", capability: "persist", timeout_ms: 80 }
  ],
  routing_policy: "weighted_health",
  tags: ["data-pipeline", "production"]
};

// POST to /api/pathways
```

### Integrating External Services

External services can join the mesh as neurons:

1. Expose a health endpoint returning latency, error_rate, and status
2. Register via `/api/register` with appropriate domain/capabilities
3. Respond to `/api/handshake` updates
4. Optionally emit signals to `/api/signal` for cross-mesh communication

---

## 📊 Production Deployment

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Google AI API key for pathway optimization |
| `NODE_ENV` | No | Set to `production` for production mode |
| `PORT` | No | Server port (default: 3000) |

### Building for Production

```bash
npm run build
# Outputs:
#   dist/index.html       - Frontend SPA
#   dist/server.cjs       - Bundled server
#   dist/assets/*.js      - Frontend bundles
```

### Running in Production

```bash
npm start
# Or directly:
node dist/server.cjs
```

### Scaling Considerations

- **Horizontal Scaling**: Deploy multiple registry instances behind a load balancer
- **Neuron Replicas**: Set `metadata.replicas` in neuron manifests for load distribution
- **Circuit Breakers**: Tune `failure_threshold` and `cooldown_sec` per domain requirements
- **Metrics Retention**: Currently stores 24 hours of metric history; extend `metricHistory` array management for longer retention

### Monitoring & Alerting

The built-in observability stack provides:

- Real-time metrics at `/api/metrics/overview`
- Trend analysis at `/api/metrics/trends`
- Alert management at `/api/alerts`
- Audit compliance at `/api/audit-logs`

Integrate with external monitoring tools (Prometheus, Datadog, etc.) by polling these endpoints or consuming the axon event stream.

---

## 🧪 Testing & Chaos Engineering

### Simulating Failures

```bash
# Trigger node failure
curl -X POST http://localhost:3000/api/neurons/nexus-router-03/toggle-failure

# Simulate traffic burst
curl -X POST http://localhost:3000/api/simulate-burst
```

The registry automatically:
- Trips circuit breakers on failing nodes
- Activates failover standbys
- Re-routes pathways around degraded nodes
- Generates alerts for operator awareness

---

## 📦 Project Structure

```
Neural-Mesh-Orchestrator/
├── server/
│   ├── registry.ts        # Core registry logic
│   ├── mockMesh.ts        # 256-neuron generator
│   └── geminiService.ts   # AI optimization service
├── src/
│   ├── components/        # React UI components
│   ├── services/          # API client services
│   ├── types/             # TypeScript interfaces
│   └── utils/             # Helper utilities
├── assets/                # Static assets
├── dist/                  # Production build output
├── server.ts              # Express server entry point
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies & scripts
```

---

## 🔮 Roadmap

- [ ] WebSocket support for real-time bi-directional axon streaming
- [ ] Persistent storage layer (PostgreSQL/MongoDB) for audit logs and metrics
- [ ] Role-based access control (RBAC) for multi-tenant deployments
- [ ] GraphQL API layer alongside REST
- [ ] Kubernetes operator for auto-scaling neuron deployments
- [ ] Visual pathway designer (drag-and-drop UI)
- [ ] Plugin architecture for custom routing policies
- [ ] Cross-mesh federation protocols

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure linting passes (`npm run lint`) and follow existing code style conventions.

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 👥 Authors

- **Zachary** - Initial architecture & implementation
- Community contributors via the Neural Mesh Orchestrator GitHub organization

---

## 🙏 Acknowledgments

- Inspired by biological neural networks and distributed systems research
- Built with [Express](https://expressjs.com/), [React](https://react.dev/), [Vite](https://vitejs.dev/), and [Google Generative AI](https://ai.google.dev/)
- Icons by [Lucide React](https://lucide.dev/)

---

**Neural Mesh Orchestrator** - Weaving intelligence through distributed computation. 🧠✨
