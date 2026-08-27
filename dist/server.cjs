var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);

// server/registry.ts
var import_crypto = __toESM(require("crypto"), 1);

// server/mockMesh.ts
var PRIMARY_NEURONS = [
  {
    id: "entangled-multimodal-system-3",
    version: "2.4.1",
    domain: "orchestration",
    entrypoint: "http://localhost:7001/api",
    capabilities: ["route", "compose", "analyze", "thread_pathway", "dynamic_balance"],
    dependencies: ["iben-genesis", "apex-mesh-router", "synapse-axon-core"],
    metadata: {
      author: "Mesh Architect Core",
      mesh_branch: "mesh-sync",
      replicas: 4,
      tags: ["core", "primary-router", "cortex"],
      description: "Master multimodal orchestration neuron coordinating multi-repo graph topologies"
    }
  },
  {
    id: "iben-genesis",
    version: "0.3.1",
    domain: "generation",
    entrypoint: "http://localhost:7002/api",
    capabilities: ["generate", "evaluate", "synthesize_lattice", "prompt_forge"],
    dependencies: ["codecraft-engine", "vector-vault-lake"],
    metadata: {
      author: "Zachary Genesis Team",
      mesh_branch: "mesh-sync",
      replicas: 3,
      tags: ["genesis", "lattice", "deep-synthesis"],
      description: "High-order generation and genesis engine for generative models & structural synthesis"
    }
  },
  {
    id: "codecraft-engine",
    version: "1.8.0",
    domain: "codecraft",
    entrypoint: "http://localhost:7003/api",
    capabilities: ["execute", "refactor", "ast_transform", "build_sandbox", "test_runner"],
    dependencies: ["eval-critic-sentinel"],
    metadata: {
      author: "CodeCraft Labs",
      mesh_branch: "mesh-sync",
      replicas: 5,
      tags: ["execution", "sandbox", "compiler"],
      description: "Zero-sandbox code crafting, AST transformation, and automated verification engine"
    }
  },
  {
    id: "apex-mesh-router",
    version: "3.1.0",
    domain: "orchestration",
    entrypoint: "http://localhost:7004/api",
    capabilities: ["route", "load_balance", "circuit_breaker", "failover_switch"],
    dependencies: ["zero-trust-axon"],
    metadata: {
      author: "Infra Mesh Guild",
      mesh_branch: "mesh-sync",
      replicas: 6,
      tags: ["routing", "high-availability"],
      description: "High-throughput lowest-latency edge router and active failover broker"
    }
  },
  {
    id: "vector-vault-lake",
    version: "4.2.0",
    domain: "storage",
    entrypoint: "http://localhost:7005/api",
    capabilities: ["query_embeddings", "store_vectors", "knn_search", "graph_persist"],
    dependencies: [],
    metadata: {
      author: "Storage Guild",
      mesh_branch: "mesh-sync",
      replicas: 3,
      tags: ["vector-db", "hsnw-index"],
      description: "Distributed billion-vector index and persistent graph embedding store"
    }
  },
  {
    id: "eval-critic-sentinel",
    version: "1.5.2",
    domain: "evaluation",
    entrypoint: "http://localhost:7006/api",
    capabilities: ["evaluate", "benchmark", "truth_verify", "loss_audit"],
    dependencies: ["vector-vault-lake"],
    metadata: {
      author: "QA & Safety Division",
      mesh_branch: "mesh-sync",
      replicas: 2,
      tags: ["safety", "benchmarking", "arbiter"],
      description: "Automated ground-truth verification and perceptual output quality evaluator"
    }
  },
  {
    id: "zero-trust-axon",
    version: "2.0.4",
    domain: "security",
    entrypoint: "http://localhost:7007/api",
    capabilities: ["authenticate", "authorize_signal", "encrypt_payload", "audit_hash"],
    dependencies: [],
    metadata: {
      author: "Security Core",
      mesh_branch: "mesh-sync",
      replicas: 3,
      tags: ["zero-trust", "cryptography", "mfa"],
      description: "Zero-trust handshake gatekeeper and HMAC-SHA256 signal verification axon"
    }
  },
  {
    id: "tensor-blade-infer",
    version: "5.0.1",
    domain: "inference",
    entrypoint: "http://localhost:7008/api",
    capabilities: ["infer_batch", "quantize_int4", "stream_tokens", "speculative_decode"],
    dependencies: ["vector-vault-lake"],
    metadata: {
      author: "Compute Systems",
      mesh_branch: "mesh-sync",
      replicas: 8,
      tags: ["vllm", "gpu-cluster", "streaming"],
      description: "Ultra-low latency tensor inference cluster with speculative decoding support"
    }
  }
];
var DOMAINS = [
  "orchestration",
  "generation",
  "codecraft",
  "inference",
  "storage",
  "evaluation",
  "agentics",
  "security",
  "interface",
  "analytics"
];
var DOMAIN_CAPABILITIES = {
  orchestration: ["route", "compose", "analyze", "thread_pathway", "dynamic_balance", "fan_out", "barrier_sync"],
  generation: ["generate", "synthesize_lattice", "prompt_forge", "diff_synthesize", "multimodal_embed"],
  codecraft: ["execute", "refactor", "ast_transform", "build_sandbox", "test_runner", "lint_scan"],
  inference: ["infer_batch", "quantize_int4", "stream_tokens", "speculative_decode", "tensor_fuse"],
  storage: ["query_embeddings", "store_vectors", "knn_search", "graph_persist", "replicate_shards"],
  evaluation: ["evaluate", "benchmark", "truth_verify", "loss_audit", "hallucination_guard"],
  agentics: ["plan_subtasks", "delegate_agent", "tool_broker", "memory_reflect", "goal_converge"],
  security: ["authenticate", "authorize_signal", "encrypt_payload", "audit_hash", "sanitize_ast"],
  interface: ["render_canvas", "dispatch_event", "stream_sse", "websocket_relay", "ui_bridge"],
  analytics: ["aggregate_metrics", "detect_anomalies", "forecast_capacity", "trace_telemetry"]
};
var REPO_NAME_PREFIXES = {
  orchestration: ["nexus-router", "cortex-gate", "synapse-weaver", "mesh-conductor", "axon-dispatcher", "flow-matrix", "entangled-hub"],
  generation: ["lattice-synth", "genesis-forge", "diff-creator", "omni-alchemist", "neural-sculptor", "prompt-matrix", "hyper-weaver"],
  codecraft: ["code-loom", "ast-rewriter", "sandbox-isolate", "test-sentinel", "compiler-node", "patch-engine", "refactor-bot"],
  inference: ["tensor-blade", "vllm-shard", "triton-stream", "quant-engine", "neural-accelerator", "blade-cluster", "infer-node"],
  storage: ["vector-lake", "embedding-vault", "synapse-store", "kv-mesh-cache", "cold-archive", "graph-db-node", "state-persist"],
  evaluation: ["truth-arbiter", "metric-probe", "benchmark-rig", "eval-critic", "guardrail-node", "loss-scanner", "accuracy-watch"],
  agentics: ["subagent-cortex", "tool-broker", "planner-node", "agent-swarm", "task-decomposer", "memory-agent", "goal-arbiter"],
  security: ["shield-gateway", "zero-trust-gate", "audit-sentinel", "crypto-vault", "tamper-guard", "policy-enforcer", "cert-synapse"],
  interface: ["canvas-relay", "telemetry-bridge", "tampermonkey-hook", "ai-studio-bridge", "websocket-mesh", "ui-socket", "stream-hub"],
  analytics: ["trend-forecaster", "latency-radar", "anomaly-seeker", "throughput-calc", "mesh-telemetry", "trace-collector", "capacity-planner"]
};
function generate256Neurons() {
  const nodes = [];
  const TOTAL_NODES = 256;
  for (let i = 0; i < PRIMARY_NEURONS.length; i++) {
    const p = PRIMARY_NEURONS[i];
    const manifest = {
      id: p.id,
      version: p.version || "1.0.0",
      domain: p.domain || "orchestration",
      entrypoint: p.entrypoint || `http://localhost:${7e3 + i}/api`,
      capabilities: p.capabilities || ["route"],
      dependencies: p.dependencies || [],
      metadata: {
        author: p.metadata?.author || "Neural Core Team",
        mesh_branch: "mesh-sync",
        replicas: p.metadata?.replicas || 2,
        tags: p.metadata?.tags || ["production"],
        description: p.metadata?.description || `Core neuron node ${p.id}`
      }
    };
    nodes.push({
      manifest,
      status: "online",
      health: {
        latency_ms: 12 + Math.floor(Math.random() * 25),
        error_rate: 0,
        cpu_pct: 18 + Math.floor(Math.random() * 30),
        memory_mb: 256 + Math.floor(Math.random() * 512),
        uptime_sec: 86400 * (3 + Math.floor(Math.random() * 30)),
        last_heartbeat: (/* @__PURE__ */ new Date()).toISOString(),
        requests_per_sec: 80 + Math.floor(Math.random() * 220),
        active_synapses: 12 + Math.floor(Math.random() * 20)
      },
      registered_at: new Date(Date.now() - 1e3 * 60 * 60 * 24 * (10 + i)).toISOString()
    });
  }
  const remainingCount = TOTAL_NODES - nodes.length;
  for (let i = 0; i < remainingCount; i++) {
    const domain = DOMAINS[i % DOMAINS.length];
    const prefixList = REPO_NAME_PREFIXES[domain];
    const prefix = prefixList[i % prefixList.length];
    const indexSuffix = Math.floor(i / prefixList.length) + 1;
    const id = `${prefix}-${indexSuffix < 10 ? "0" + indexSuffix : indexSuffix}`;
    const port = 7010 + i;
    const availableCaps = [...DOMAIN_CAPABILITIES[domain]];
    const capsCount = 2 + i % 3;
    const selectedCaps = availableCaps.slice(0, capsCount);
    if (i % 5 === 0) {
      selectedCaps.push("route");
    }
    const dependencies = [];
    if (nodes.length > 0) {
      const depTarget1 = nodes[Math.floor(Math.random() * nodes.length)].manifest.id;
      dependencies.push(depTarget1);
      if (Math.random() > 0.4 && nodes.length > 3) {
        const depTarget2 = nodes[Math.floor(Math.random() * nodes.length)].manifest.id;
        if (depTarget2 !== depTarget1) dependencies.push(depTarget2);
      }
    }
    let status = "online";
    let latency = 8 + Math.floor(Math.random() * 45);
    let errorRate = Math.random() < 0.85 ? 0 : parseFloat((Math.random() * 0.02).toFixed(3));
    if (i === 14 || i === 42 || i === 89) {
      status = "degraded";
      latency = 120 + Math.floor(Math.random() * 180);
      errorRate = 0.08 + parseFloat((Math.random() * 0.05).toFixed(3));
    } else if (i === 104) {
      status = "failover_standby";
      latency = 15;
    } else if (i === 177) {
      status = "offline";
      latency = 999;
      errorRate = 1;
    }
    const manifest = {
      id,
      version: `1.${i % 12}.${i % 5}`,
      domain,
      entrypoint: `http://localhost:${port}/api`,
      capabilities: selectedCaps,
      dependencies,
      metadata: {
        author: `Neuron Cell Alpha-${i % 8 + 1}`,
        mesh_branch: "mesh-sync",
        replicas: 1 + i % 4,
        tags: [domain, "mesh-sync", `shard-${i % 16}`],
        description: `Microservice repository neuron specialized in ${domain} operations.`
      }
    };
    nodes.push({
      manifest,
      status,
      health: {
        latency_ms: latency,
        error_rate: errorRate,
        cpu_pct: 10 + Math.floor(Math.random() * 55),
        memory_mb: 180 + Math.floor(Math.random() * 700),
        uptime_sec: 86400 * (1 + Math.floor(Math.random() * 45)),
        last_heartbeat: new Date(Date.now() - (status === "offline" ? 36e5 : Math.floor(Math.random() * 15e3))).toISOString(),
        requests_per_sec: status === "offline" ? 0 : 20 + Math.floor(Math.random() * 180),
        active_synapses: 4 + Math.floor(Math.random() * 16)
      },
      registered_at: new Date(Date.now() - 1e3 * 60 * 60 * 24 * (5 + i % 60)).toISOString(),
      failover_target: status === "degraded" || status === "offline" ? "apex-mesh-router" : void 0,
      circuit_tripped: status === "offline"
    });
  }
  return nodes;
}

// server/registry.ts
var NeuralMeshRegistry = class {
  constructor() {
    this.nodes = /* @__PURE__ */ new Map();
    this.pathways = /* @__PURE__ */ new Map();
    this.executionHistory = [];
    this.messageBus = [];
    this.alerts = [];
    this.auditLogs = [];
    this.metricHistory = [];
    this.roundRobinCounters = /* @__PURE__ */ new Map();
    this.initializeMesh();
    this.seedDefaultPathways();
    this.seedInitialMetrics();
    this.startBackgroundHeartbeatSimulator();
  }
  initializeMesh() {
    const initialNodes = generate256Neurons();
    for (const node of initialNodes) {
      this.nodes.set(node.manifest.id, node);
    }
    this.logAudit(
      "MESH_INITIALIZED",
      "system",
      "admin",
      `Initialized neural mesh cortex with 256 repository nodes across 10 functional domains.`
    );
  }
  seedDefaultPathways() {
    const defaultPipelines = [
      {
        id: "orchestrated-lattice-build",
        name: "Orchestrated Lattice Build",
        description: "Multi-repo synthesis chain: routes prompt, synthesizes lattice body, transforms AST, and executes in sandbox.",
        steps: [
          { neuronId: "entangled-multimodal-system-3", capability: "route", timeout_ms: 120 },
          { neuronId: "iben-genesis", capability: "generate", fallbackNeuronId: "lattice-synth-01", timeout_ms: 350 },
          { neuronId: "codecraft-engine", capability: "execute", fallbackNeuronId: "code-loom-01", timeout_ms: 200 },
          { neuronId: "eval-critic-sentinel", capability: "evaluate", timeout_ms: 150 }
        ],
        routing_policy: "least_latency",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        tags: ["synthesis", "production", "verified"]
      },
      {
        id: "fast-speculative-infer-chain",
        name: "Speculative Token Stream & Embed",
        description: "Dispatches high-frequency token inference, verifies embeddings in vector lake, and runs truth arbitration.",
        steps: [
          { neuronId: "apex-mesh-router", capability: "route", timeout_ms: 50 },
          { neuronId: "tensor-blade-infer", capability: "infer_batch", fallbackNeuronId: "tensor-blade-01", timeout_ms: 180 },
          { neuronId: "vector-vault-lake", capability: "query_embeddings", timeout_ms: 90 },
          { neuronId: "eval-critic-sentinel", capability: "truth_verify", timeout_ms: 100 }
        ],
        routing_policy: "weighted_health",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        tags: ["inference", "realtime"]
      },
      {
        id: "zero-trust-codecraft-pipeline",
        name: "Zero-Trust Secure AST Rewrite",
        description: "Authenticates caller, refactors code AST, verifies security policy, and commits to mesh-sync branch.",
        steps: [
          { neuronId: "zero-trust-axon", capability: "authenticate", timeout_ms: 40 },
          { neuronId: "codecraft-engine", capability: "ast_transform", fallbackNeuronId: "ast-rewriter-01", timeout_ms: 220 },
          { neuronId: "eval-critic-sentinel", capability: "loss_audit", timeout_ms: 120 },
          { neuronId: "entangled-multimodal-system-3", capability: "compose", timeout_ms: 90 }
        ],
        routing_policy: "failover_priority",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        tags: ["security", "compliance"]
      }
    ];
    for (const p of defaultPipelines) {
      this.pathways.set(p.id, p);
    }
  }
  seedInitialMetrics() {
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now - i * 36e5).toISOString();
      const jitter = Math.sin(i / 3) * 8;
      this.metricHistory.push({
        timestamp,
        total_requests: 12e3 + Math.floor(Math.random() * 4e3) + Math.floor(jitter * 200),
        avg_latency_ms: 28 + Math.floor(Math.random() * 8) + jitter,
        p95_latency_ms: 54 + Math.floor(Math.random() * 18) + jitter * 1.5,
        error_rate_pct: parseFloat((0.02 + Math.random() * 0.04).toFixed(3)),
        active_nodes: 252 + (i % 3 === 0 ? -1 : 0),
        degraded_nodes: 3 + (i % 4 === 0 ? 1 : 0),
        offline_nodes: 1,
        axon_throughput_kbps: 450 + Math.floor(Math.random() * 150),
        circuit_trips: i % 6 === 0 ? 1 : 0
      });
    }
    this.alerts.push({
      id: "alt-" + Math.random().toString(36).substring(2, 9),
      severity: "warning",
      title: "Latency Threshold Warning on Node",
      message: "Node nexus-router-03 experienced temporary spike to 142ms (>100ms threshold). Auto-load rebalanced.",
      neuron_id: "nexus-router-03",
      timestamp: new Date(Date.now() - 1e3 * 60 * 22).toISOString(),
      acknowledged: false,
      auto_mitigated: true
    });
  }
  // Background heartbeat simulator
  startBackgroundHeartbeatSimulator() {
    setInterval(() => {
      this.simulateMeshTick();
    }, 5e3);
  }
  simulateMeshTick() {
    const nodeKeys = Array.from(this.nodes.keys());
    if (nodeKeys.length === 0) return;
    for (let i = 0; i < 5; i++) {
      const randomKey = nodeKeys[Math.floor(Math.random() * nodeKeys.length)];
      const node = this.nodes.get(randomKey);
      if (node && node.status !== "offline") {
        const drift = (Math.random() - 0.5) * 4;
        const newLatency = Math.max(5, Math.min(300, Math.round(node.health.latency_ms + drift)));
        node.health.latency_ms = newLatency;
        node.health.last_heartbeat = (/* @__PURE__ */ new Date()).toISOString();
        node.health.requests_per_sec = Math.max(5, Math.min(500, Math.round((node.health.requests_per_sec || 50) + (Math.random() - 0.5) * 10)));
      }
    }
    if (Math.random() > 0.4) {
      const sampleNode = nodeKeys[Math.floor(Math.random() * nodeKeys.length)];
      this.emitMessage({
        source: sampleNode,
        target: "cortex-registry",
        signal_type: "heartbeat",
        payload: { status: "healthy", jitter_ms: Math.floor(Math.random() * 5) },
        trace_id: "hb-" + Math.random().toString(36).substring(2, 8),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        hop_count: 1
      });
    }
  }
  // --- REGISTRATION & HANDSHAKE ---
  registerNeuron(manifest, status = "online") {
    if (!manifest.id || !manifest.version || !manifest.domain || !manifest.entrypoint || !manifest.capabilities) {
      throw new Error("Invalid neuron.json schema: missing required fields id, version, domain, entrypoint, or capabilities.");
    }
    const existing = this.nodes.get(manifest.id);
    const node = {
      manifest: {
        ...manifest,
        dependencies: manifest.dependencies || [],
        metadata: {
          mesh_branch: manifest.metadata?.mesh_branch || "mesh-sync",
          author: manifest.metadata?.author || "Community Node",
          replicas: manifest.metadata?.replicas || 1,
          tags: manifest.metadata?.tags || [manifest.domain],
          description: manifest.metadata?.description || `Neuron node ${manifest.id}`
        }
      },
      status: status || "online",
      health: {
        latency_ms: existing ? existing.health.latency_ms : 15 + Math.floor(Math.random() * 20),
        error_rate: existing ? existing.health.error_rate : 0,
        cpu_pct: 22,
        memory_mb: 256,
        uptime_sec: existing ? existing.health.uptime_sec : 1,
        last_heartbeat: (/* @__PURE__ */ new Date()).toISOString(),
        requests_per_sec: 10,
        active_synapses: manifest.dependencies.length + 2
      },
      registered_at: existing ? existing.registered_at : (/* @__PURE__ */ new Date()).toISOString(),
      failover_target: void 0,
      circuit_tripped: false
    };
    this.nodes.set(manifest.id, node);
    this.logAudit(
      existing ? "NEURON_UPDATED" : "NEURON_REGISTERED",
      manifest.metadata?.author || "mesh-api",
      "architect",
      `Registered neuron ${manifest.id} (domain: ${manifest.domain}, capabilities: [${manifest.capabilities.join(", ")}])`
    );
    this.emitMessage({
      source: manifest.id,
      target: "cortex-registry",
      signal_type: "handshake",
      payload: { action: "register", version: manifest.version, domain: manifest.domain },
      trace_id: "reg-" + Math.random().toString(36).substring(2, 9),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      hop_count: 1
    });
    return node;
  }
  recordHandshake(neuronId, data) {
    const node = this.nodes.get(neuronId);
    if (!node) {
      throw new Error(`Neuron '${neuronId}' not found in cortex registry.`);
    }
    if (data.status) {
      node.status = data.status;
    }
    if (data.health) {
      if (typeof data.health.latency_ms === "number") node.health.latency_ms = data.health.latency_ms;
      if (typeof data.health.error_rate === "number") node.health.error_rate = data.health.error_rate;
      if (typeof data.health.cpu_pct === "number") node.health.cpu_pct = data.health.cpu_pct;
      if (typeof data.health.memory_mb === "number") node.health.memory_mb = data.health.memory_mb;
      if (typeof data.health.requests_per_sec === "number") node.health.requests_per_sec = data.health.requests_per_sec;
    }
    node.health.last_heartbeat = (/* @__PURE__ */ new Date()).toISOString();
    if (node.health.latency_ms > 120 && node.status !== "offline") {
      this.triggerAlert("warning", `High Latency Detected on ${node.manifest.id}`, `Node latency reached ${node.health.latency_ms}ms (threshold: 100ms)`, node.manifest.id);
    }
    if (node.health.error_rate > 0.05 && node.status !== "offline") {
      this.triggerAlert("critical", `Elevated Error Rate on ${node.manifest.id}`, `Error rate spiked to ${(node.health.error_rate * 100).toFixed(1)}%`, node.manifest.id);
    }
    return node;
  }
  getNeurons(filters) {
    let result = Array.from(this.nodes.values());
    if (filters) {
      if (filters.domain) {
        result = result.filter((n) => n.manifest.domain.toLowerCase() === filters.domain.toLowerCase());
      }
      if (filters.capability) {
        result = result.filter((n) => n.manifest.capabilities.some((c) => c.toLowerCase().includes(filters.capability.toLowerCase())));
      }
      if (filters.status) {
        result = result.filter((n) => n.status.toLowerCase() === filters.status.toLowerCase());
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (n) => n.manifest.id.toLowerCase().includes(q) || n.manifest.domain.toLowerCase().includes(q) || n.manifest.capabilities.some((c) => c.toLowerCase().includes(q)) || (n.manifest.metadata?.description || "").toLowerCase().includes(q)
        );
      }
    }
    return result;
  }
  getNeuronById(id) {
    return this.nodes.get(id);
  }
  deleteNeuron(id) {
    const deleted = this.nodes.delete(id);
    if (deleted) {
      this.logAudit("NEURON_DEREGISTERED", "operator", "operator", `Deregistered neuron ${id} from mesh`);
    }
    return deleted;
  }
  // --- PATHWAY ROUTING ENGINE & GRAPH TRAVERSAL ---
  findPathways(fromNeuronId, toNeuronId, requiredCaps) {
    const startNode = this.nodes.get(fromNeuronId);
    const endNode = this.nodes.get(toNeuronId);
    if (!startNode || !endNode) {
      return {
        direct_available: false,
        recommended_path: [],
        alternative_paths: [],
        estimated_latency_ms: 0
      };
    }
    const paths = [];
    const queue = [
      { current: fromNeuronId, path: [fromNeuronId], latency: startNode.health.latency_ms }
    ];
    const visited = /* @__PURE__ */ new Set();
    while (queue.length > 0 && paths.length < 5) {
      const { current, path: path2, latency } = queue.shift();
      if (current === toNeuronId && path2.length > 1) {
        paths.push(path2);
        continue;
      }
      visited.add(current);
      const currNode = this.nodes.get(current);
      if (!currNode) continue;
      const neighbors = new Set(currNode.manifest.dependencies || []);
      for (const node of this.nodes.values()) {
        if (node.status === "offline") continue;
        if (currNode.manifest.capabilities.some((c) => node.manifest.capabilities.includes(c)) || currNode.manifest.domain === "orchestration" && node.manifest.domain !== "orchestration") {
          if (neighbors.size < 8) {
            neighbors.add(node.manifest.id);
          }
        }
      }
      for (const next of neighbors) {
        if (!path2.includes(next) && path2.length < 6) {
          const nextNode = this.nodes.get(next);
          if (nextNode && nextNode.status !== "offline") {
            queue.push({
              current: next,
              path: [...path2, next],
              latency: latency + nextNode.health.latency_ms
            });
          }
        }
      }
    }
    if (paths.length === 0) {
      paths.push([fromNeuronId, "entangled-multimodal-system-3", toNeuronId]);
    }
    paths.sort((a, b) => {
      const latA = a.reduce((sum, id) => sum + (this.nodes.get(id)?.health.latency_ms || 20), 0);
      const latB = b.reduce((sum, id) => sum + (this.nodes.get(id)?.health.latency_ms || 20), 0);
      return latA - latB;
    });
    const recommended = paths[0] || [fromNeuronId, toNeuronId];
    const estLatency = recommended.reduce((sum, id) => sum + (this.nodes.get(id)?.health.latency_ms || 20), 0);
    return {
      direct_available: recommended.length === 2,
      recommended_path: recommended,
      alternative_paths: paths.slice(1),
      estimated_latency_ms: estLatency
    };
  }
  getPathways() {
    return Array.from(this.pathways.values());
  }
  getPathwayById(id) {
    return this.pathways.get(id);
  }
  savePathway(pathway) {
    if (!pathway.id || !pathway.name || !pathway.steps || pathway.steps.length === 0) {
      throw new Error("Pathway must have id, name, and at least one step.");
    }
    pathway.created_at = pathway.created_at || (/* @__PURE__ */ new Date()).toISOString();
    this.pathways.set(pathway.id, pathway);
    this.logAudit("PATHWAY_CONFIGURED", "architect", "architect", `Configured pathway ${pathway.id} with ${pathway.steps.length} threaded steps.`);
    return pathway;
  }
  deletePathway(id) {
    return this.pathways.delete(id);
  }
  // --- PATHWAY EXECUTION & AXON SIGNALLING ---
  async executePathway(pathwayId, initialPayload = { prompt: "Execute neural synthesis", context: { requester: "zachary" } }) {
    const pathway = this.pathways.get(pathwayId);
    if (!pathway) {
      throw new Error(`Pathway '${pathwayId}' not registered in mesh.`);
    }
    const traceId = "tr-" + Math.random().toString(36).substring(2, 10) + "-" + Date.now().toString(36);
    const startedAt = (/* @__PURE__ */ new Date()).toISOString();
    const stepsLog = [];
    let currentPayload = { ...initialPayload };
    let overallSuccess = true;
    let totalLatency = 0;
    for (let i = 0; i < pathway.steps.length; i++) {
      const step = pathway.steps[i];
      let targetNeuron = this.nodes.get(step.neuronId);
      let usedFallback = false;
      if (!targetNeuron || targetNeuron.status === "offline" || targetNeuron.status === "degraded" && step.fallbackNeuronId) {
        if (step.fallbackNeuronId && this.nodes.has(step.fallbackNeuronId)) {
          targetNeuron = this.nodes.get(step.fallbackNeuronId);
          usedFallback = true;
          this.triggerAlert("warning", `Failover Route Active on Step ${i + 1}`, `Primary neuron ${step.neuronId} unavailable. Routed to standby ${step.fallbackNeuronId}.`, step.neuronId, pathwayId);
        }
      }
      const stepNeuronId = targetNeuron ? targetNeuron.manifest.id : step.neuronId;
      const stepLatency = targetNeuron ? Math.max(5, targetNeuron.health.latency_ms + Math.floor((Math.random() - 0.5) * 6)) : 50;
      totalLatency += stepLatency;
      const reqEnvelope = {
        pathway_id: pathwayId,
        source: i === 0 ? "client-ingress" : pathway.steps[i - 1].neuronId,
        target: stepNeuronId,
        signal_type: "request",
        payload: currentPayload,
        trace_id: traceId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        hop_count: i + 1,
        latency_ms: stepLatency
      };
      this.emitMessage(reqEnvelope);
      const stepOutput = {
        ...currentPayload,
        step_completed: i + 1,
        processed_by: stepNeuronId,
        capability_executed: step.capability,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (step.capability === "route") {
        stepOutput.route_plan = ["entangled-multimodal-system-3", "iben-genesis", "codecraft-engine"];
        stepOutput.optimal_load_factor = 0.94;
      } else if (step.capability === "generate" || step.capability === "synthesize_lattice") {
        stepOutput.generated_lattice = {
          lattice_id: "lat-" + Math.random().toString(36).substring(2, 7),
          nodes_synthesized: 64,
          tensor_dimensions: [512, 768],
          confidence: 0.992
        };
      } else if (step.capability === "execute" || step.capability === "ast_transform") {
        stepOutput.execution_sandbox = {
          status: "verified",
          exit_code: 0,
          memory_peak_kb: 48200,
          ast_nodes_rewritten: 312
        };
      } else if (step.capability === "evaluate" || step.capability === "truth_verify") {
        stepOutput.eval_score = 0.988;
        stepOutput.guardrail_passed = true;
        stepOutput.loss_metric = 0.012;
      }
      currentPayload = stepOutput;
      this.emitMessage({
        pathway_id: pathwayId,
        source: stepNeuronId,
        target: i === pathway.steps.length - 1 ? "client-egress" : pathway.steps[i + 1].neuronId,
        signal_type: usedFallback ? "failover_trigger" : "response",
        payload: { status: "ok", capability: step.capability, result_summary: `Executed ${step.capability} in ${stepLatency}ms` },
        trace_id: traceId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        hop_count: i + 1,
        latency_ms: stepLatency
      });
      stepsLog.push({
        step_index: i + 1,
        neuron_id: stepNeuronId,
        capability: step.capability,
        status: usedFallback ? "fallback_used" : "success",
        latency_ms: stepLatency,
        input_payload: reqEnvelope.payload,
        output_payload: stepOutput,
        executed_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const completedAt = (/* @__PURE__ */ new Date()).toISOString();
    const auditHash = import_crypto.default.createHash("sha256").update(traceId + startedAt + JSON.stringify(currentPayload)).digest("hex");
    const result = {
      trace_id: traceId,
      pathway_id: pathwayId,
      status: overallSuccess ? "success" : "failed",
      started_at: startedAt,
      completed_at: completedAt,
      total_latency_ms: totalLatency,
      steps: stepsLog,
      initial_payload: initialPayload,
      final_output: currentPayload,
      audit_hash: auditHash
    };
    this.executionHistory.unshift(result);
    if (this.executionHistory.length > 100) this.executionHistory.pop();
    this.logAudit(
      "PATHWAY_EXECUTED",
      "pathway-engine",
      "operator",
      `Executed pathway '${pathwayId}' with trace ${traceId} across ${stepsLog.length} hops in ${totalLatency}ms (Hash: ${auditHash.substring(0, 10)}...)`
    );
    return result;
  }
  getExecutionHistory() {
    return this.executionHistory;
  }
  // --- AXON MESSAGE BUS ---
  emitMessage(envelope) {
    this.messageBus.unshift(envelope);
    if (this.messageBus.length > 500) {
      this.messageBus.pop();
    }
  }
  getMessageBus(limit = 100, filterType, traceId) {
    let list = this.messageBus;
    if (filterType) {
      list = list.filter((m) => m.signal_type === filterType);
    }
    if (traceId) {
      list = list.filter((m) => m.trace_id === traceId);
    }
    return list.slice(0, limit);
  }
  // --- OBSERVABILITY, METRICS & ALERTS ---
  getMetricsOverview() {
    const nodesList = Array.from(this.nodes.values());
    const online = nodesList.filter((n) => n.status === "online").length;
    const degraded = nodesList.filter((n) => n.status === "degraded").length;
    const offline = nodesList.filter((n) => n.status === "offline").length;
    const standby = nodesList.filter((n) => n.status === "failover_standby").length;
    const latencies = nodesList.map((n) => n.health.latency_ms).filter((l) => l < 500);
    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const p95Latency = sortedLatencies.length > 0 ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] : 0;
    const totalRps = nodesList.reduce((sum, n) => sum + (n.health.requests_per_sec || 0), 0);
    return {
      total_nodes: nodesList.length,
      online_nodes: online,
      degraded_nodes: degraded,
      offline_nodes: offline,
      standby_nodes: standby,
      avg_mesh_latency_ms: avgLatency,
      p95_mesh_latency_ms: p95Latency,
      total_throughput_rps: totalRps,
      total_active_synapses: nodesList.reduce((sum, n) => sum + (n.health.active_synapses || 0), 0),
      active_alerts_count: this.alerts.filter((a) => !a.acknowledged).length,
      axon_queue_size: this.messageBus.length,
      total_pathways_configured: this.pathways.size,
      total_traces_recorded: this.executionHistory.length
    };
  }
  getMetricTrends() {
    return this.metricHistory;
  }
  getAlerts() {
    return this.alerts;
  }
  acknowledgeAlert(id) {
    const a = this.alerts.find((item) => item.id === id);
    if (a) {
      a.acknowledged = true;
      this.logAudit("ALERT_ACKNOWLEDGED", "operator", "operator", `Acknowledged alert: ${a.title}`);
      return true;
    }
    return false;
  }
  triggerAlert(severity, title, message, neuronId, pathwayId) {
    const alertItem = {
      id: "alt-" + Math.random().toString(36).substring(2, 9),
      severity,
      title,
      message,
      neuron_id: neuronId,
      pathway_id: pathwayId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      acknowledged: false,
      auto_mitigated: severity !== "critical"
    };
    this.alerts.unshift(alertItem);
    if (this.alerts.length > 100) this.alerts.pop();
    this.emitMessage({
      source: neuronId || "mesh-monitor",
      target: "alert-dispatcher",
      signal_type: "alert",
      payload: { severity, title, message },
      trace_id: "alt-tr-" + alertItem.id,
      timestamp: alertItem.timestamp,
      hop_count: 1
    });
  }
  // --- COMPLIANCE AUDIT & SECURITY ---
  logAudit(action, actor, role, details) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const prevHash = this.auditLogs.length > 0 ? this.auditLogs[0].hash : "00000000000000000000000000000000";
    const hash = import_crypto.default.createHash("sha256").update(prevHash + action + actor + details + timestamp).digest("hex");
    const log = {
      id: "aud-" + Math.random().toString(36).substring(2, 9),
      action,
      actor,
      role,
      details,
      timestamp,
      hash,
      ip_address: "10.240.0.1 (Mesh Ingress)"
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
  }
  getAuditLogs() {
    return this.auditLogs;
  }
  // --- LOAD & FAILURE SIMULATION ---
  simulateLoadBurst() {
    for (const node of this.nodes.values()) {
      if (node.status === "online") {
        node.health.requests_per_sec = Math.round((node.health.requests_per_sec || 50) * (1.5 + Math.random() * 2));
        node.health.latency_ms = Math.round(node.health.latency_ms * 1.3);
      }
    }
    this.triggerAlert("warning", "Traffic Surge Injected", "Simulated 250% load burst across mesh topology.");
    this.logAudit("SIMULATION_LOAD_BURST", "operator", "admin", "Triggered traffic surge across all 256 nodes.");
  }
  injectNodeFailure(neuronId) {
    const node = this.nodes.get(neuronId);
    if (node) {
      node.status = "offline";
      node.circuit_tripped = true;
      node.health.latency_ms = 999;
      node.health.error_rate = 1;
      this.triggerAlert("critical", `Node Failure Injected: ${neuronId}`, `Node ${neuronId} marked OFFLINE. Circuit breaker tripped.`, neuronId);
      this.logAudit("SIMULATION_NODE_FAILURE", "operator", "admin", `Simulated failure on node ${neuronId}`);
    }
  }
  recoverNode(neuronId) {
    const node = this.nodes.get(neuronId);
    if (node) {
      node.status = "online";
      node.circuit_tripped = false;
      node.health.latency_ms = 18 + Math.floor(Math.random() * 15);
      node.health.error_rate = 0;
      node.health.last_heartbeat = (/* @__PURE__ */ new Date()).toISOString();
      this.logAudit("NODE_RECOVERED", "operator", "admin", `Restored node ${neuronId} to online state.`);
    }
  }
};
var registry = new NeuralMeshRegistry();

// server/geminiService.ts
var import_genai = require("@google/genai");
var aiClient = null;
function getAiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}
async function optimizePathwayWithAI(goalDescription, availableNodes, currentPathway) {
  const client = getAiClient();
  const nodeSummary = availableNodes.slice(0, 50).map((n) => ({
    id: n.manifest.id,
    domain: n.manifest.domain,
    caps: n.manifest.capabilities,
    latency_ms: n.health.latency_ms,
    status: n.status
  }));
  if (client) {
    try {
      const prompt = `You are the Cortex Optimization Engine for a 256-node Neural Mesh microservice architecture.
Goal: "${goalDescription}"
Current Pathway: ${currentPathway ? JSON.stringify(currentPathway) : "None (create new)"}

Top Available Candidate Nodes:
${JSON.stringify(nodeSummary, null, 2)}

Provide a JSON object response with:
1. recommended_pathway: { id, name, description, routing_policy, steps: [{ neuronId, capability, timeout_ms, fallbackNeuronId }] }
2. reasoning: string (explanation of routing choices and load-balancing strategy)
3. bottleneck_analysis: string (analysis of latency & potential failover points)
4. suggested_fallbacks: object mapping primary neuronId to fallback neuronId.

Return ONLY raw valid JSON.`;
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch (err) {
      console.warn("Gemini optimization fallback to heuristic engine:", err);
    }
  }
  const orchestrationNode = availableNodes.find((n) => n.manifest.domain === "orchestration" && n.status === "online") || availableNodes[0];
  const generationNode = availableNodes.find((n) => n.manifest.domain === "generation" && n.status === "online") || availableNodes[1];
  const executionNode = availableNodes.find((n) => n.manifest.domain === "codecraft" && n.status === "online") || availableNodes[2];
  const evaluationNode = availableNodes.find((n) => n.manifest.domain === "evaluation" && n.status === "online") || availableNodes[3];
  return {
    recommended_pathway: {
      id: "ai-optimized-" + Math.random().toString(36).substring(2, 8),
      name: "AI Neural Thread: " + goalDescription.substring(0, 30),
      description: `Auto-synthesized dynamic routing pipeline for '${goalDescription}' with lowest-latency candidate selection.`,
      routing_policy: "least_latency",
      steps: [
        {
          neuronId: orchestrationNode.manifest.id,
          capability: "route",
          timeout_ms: 60,
          fallbackNeuronId: "apex-mesh-router"
        },
        {
          neuronId: generationNode.manifest.id,
          capability: "generate",
          timeout_ms: 250,
          fallbackNeuronId: "lattice-synth-01"
        },
        {
          neuronId: executionNode.manifest.id,
          capability: "execute",
          timeout_ms: 180,
          fallbackNeuronId: "code-loom-01"
        },
        {
          neuronId: evaluationNode.manifest.id,
          capability: "evaluate",
          timeout_ms: 100,
          fallbackNeuronId: "eval-critic-sentinel"
        }
      ]
    },
    reasoning: `Selected lowest-latency nodes across domains with optimal dependency affinity (${orchestrationNode.health.latency_ms}ms -> ${generationNode.health.latency_ms}ms -> ${executionNode.health.latency_ms}ms -> ${evaluationNode.health.latency_ms}ms). Total predicted latency ~${orchestrationNode.health.latency_ms + generationNode.health.latency_ms + executionNode.health.latency_ms + evaluationNode.health.latency_ms}ms.`,
    bottleneck_analysis: `Primary attention required at generation step due to payload synthesis overhead. Pre-allocated fallback routes on standby nodes with active circuit breaker threshold at 200ms.`,
    suggested_fallbacks: {
      [orchestrationNode.manifest.id]: "apex-mesh-router",
      [generationNode.manifest.id]: "lattice-synth-01",
      [executionNode.manifest.id]: "code-loom-01",
      [evaluationNode.manifest.id]: "eval-critic-sentinel"
    }
  };
}

// server.ts
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      service: "Neural Mesh Cortex Registry",
      nodes_count: registry.getNeurons().length,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  const handleRegister = (req, res) => {
    try {
      const manifest = req.body.manifest || req.body;
      const status = req.body.status || "online";
      const node = registry.registerNeuron(manifest, status);
      res.status(201).json({
        success: true,
        message: `Neuron '${node.manifest.id}' successfully registered in Neural Mesh cortex.`,
        neuron: node
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
  app.post("/api/register", handleRegister);
  app.post("/register", handleRegister);
  const handleHandshake = (req, res) => {
    try {
      const { neuron_id, status, health } = req.body;
      if (!neuron_id) {
        return res.status(400).json({ success: false, error: "Missing neuron_id in handshake payload." });
      }
      const node = registry.recordHandshake(neuron_id, { status, health });
      res.json({
        success: true,
        message: "Handshake synapse updated successfully.",
        neuron_id: node.manifest.id,
        status: node.status,
        health: node.health,
        acknowledged_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      res.status(404).json({ success: false, error: err.message });
    }
  };
  app.patch("/api/handshake", handleHandshake);
  app.post("/api/handshake", handleHandshake);
  app.patch("/handshake", handleHandshake);
  app.post("/handshake", handleHandshake);
  const handleGetNeurons = (req, res) => {
    const { domain, capability, status, search } = req.query;
    const nodes = registry.getNeurons({
      domain,
      capability,
      status,
      search
    });
    res.json({
      total: nodes.length,
      neurons: nodes
    });
  };
  app.get("/api/neurons", handleGetNeurons);
  app.get("/neurons", handleGetNeurons);
  app.get("/api/neurons/:id", (req, res) => {
    const node = registry.getNeuronById(req.params.id);
    if (!node) {
      return res.status(404).json({ success: false, error: "Neuron node not found" });
    }
    res.json(node);
  });
  app.delete("/api/neurons/:id", (req, res) => {
    const ok = registry.deleteNeuron(req.params.id);
    res.json({ success: ok });
  });
  app.post("/api/neurons/:id/toggle-failure", (req, res) => {
    const node = registry.getNeuronById(req.params.id);
    if (!node) return res.status(404).json({ success: false, error: "Neuron not found" });
    if (node.status === "offline") {
      registry.recoverNode(req.params.id);
    } else {
      registry.injectNodeFailure(req.params.id);
    }
    res.json({ success: true, node: registry.getNeuronById(req.params.id) });
  });
  const handleGetPathways = (req, res) => {
    const { from, to } = req.query;
    if (from && to) {
      const routing = registry.findPathways(from, to);
      return res.json(routing);
    }
    res.json({
      total: registry.getPathways().length,
      pathways: registry.getPathways()
    });
  };
  app.get("/api/pathways", handleGetPathways);
  app.get("/pathways", handleGetPathways);
  const handleGetPathwayById = (req, res) => {
    const pathway = registry.getPathwayById(req.params.id);
    if (!pathway) return res.status(404).json({ success: false, error: "Pathway not found" });
    res.json({ success: true, pathway });
  };
  app.get("/api/pathways/:id", handleGetPathwayById);
  app.get("/pathways/:id", handleGetPathwayById);
  app.post("/api/pathways", (req, res) => {
    try {
      const saved = registry.savePathway(req.body);
      res.status(201).json({ success: true, pathway: saved });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });
  app.delete("/api/pathways/:id", (req, res) => {
    const ok = registry.deletePathway(req.params.id);
    res.json({ success: ok });
  });
  app.post("/api/pathways/execute", async (req, res) => {
    try {
      const { pathway_id, payload } = req.body;
      if (!pathway_id) return res.status(400).json({ success: false, error: "Missing pathway_id" });
      const result = await registry.executePathway(pathway_id, payload);
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/pathways/history", (req, res) => {
    res.json({ history: registry.getExecutionHistory() });
  });
  app.post("/api/signal", (req, res) => {
    try {
      const { source, target, signal_type, payload, pathway_id } = req.body;
      if (!source || !target || !signal_type) {
        return res.status(400).json({ success: false, error: "Missing source, target, or signal_type" });
      }
      const envelope = {
        source,
        target,
        signal_type: signal_type || "request",
        payload: payload || {},
        pathway_id,
        trace_id: "sig-" + Math.random().toString(36).substring(2, 9),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        hop_count: 1
      };
      registry.emitMessage(envelope);
      res.json({ success: true, envelope });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/bus/events", (req, res) => {
    const { limit, type, trace_id } = req.query;
    const events = registry.getMessageBus(
      limit ? parseInt(limit) : 50,
      type,
      trace_id
    );
    res.json({ total: events.length, events });
  });
  app.get("/api/metrics/overview", (req, res) => {
    res.json(registry.getMetricsOverview());
  });
  app.get("/api/metrics/trends", (req, res) => {
    res.json({ trends: registry.getMetricTrends() });
  });
  app.get("/api/alerts", (req, res) => {
    res.json({ alerts: registry.getAlerts() });
  });
  app.post("/api/alerts/:id/ack", (req, res) => {
    const ok = registry.acknowledgeAlert(req.params.id);
    res.json({ success: ok });
  });
  app.post("/api/simulate-burst", (req, res) => {
    registry.simulateLoadBurst();
    res.json({ success: true, message: "Traffic surge simulated across mesh." });
  });
  app.get("/api/audit-logs", (req, res) => {
    res.json({ logs: registry.getAuditLogs() });
  });
  app.post("/api/ai/optimize-pathway", async (req, res) => {
    try {
      const { goal, pathway_id } = req.body;
      const current = pathway_id ? registry.getPathways().find((p) => p.id === pathway_id) : void 0;
      const optimization = await optimizePathwayWithAI(goal || "Build optimized synthesis pathway", registry.getNeurons(), current);
      res.json({ success: true, optimization });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/export", (req, res) => {
    const format = req.query.format || "json";
    const meshData = {
      exported_at: (/* @__PURE__ */ new Date()).toISOString(),
      nodes: registry.getNeurons(),
      pathways: registry.getPathways(),
      metrics: registry.getMetricsOverview(),
      audit_logs: registry.getAuditLogs()
    };
    if (format === "csv") {
      const headers = ["id", "domain", "version", "status", "latency_ms", "error_rate", "capabilities", "dependencies", "entrypoint"];
      const rows = meshData.nodes.map((n) => [
        n.manifest.id,
        n.manifest.domain,
        n.manifest.version,
        n.status,
        n.health.latency_ms,
        n.health.error_rate,
        `"${n.manifest.capabilities.join(";")}"`,
        `"${n.manifest.dependencies.join(";")}"`,
        n.manifest.entrypoint
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="neural-mesh-nodes.csv"');
      return res.send(csv);
    }
    res.json(meshData);
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Neural Mesh Cortex Router listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
