import { NeuronNode, NeuronManifest } from '../src/types/neuron.ts';

// Pre-curated specialized primary nodes requested in the prompt
const PRIMARY_NEURONS: Partial<NeuronManifest>[] = [
  {
    id: 'entangled-multimodal-system-3',
    version: '2.4.1',
    domain: 'orchestration',
    entrypoint: 'http://localhost:7001/api',
    capabilities: ['route', 'compose', 'analyze', 'thread_pathway', 'dynamic_balance'],
    dependencies: ['iben-genesis', 'apex-mesh-router', 'synapse-axon-core'],
    metadata: {
      author: 'Mesh Architect Core',
      mesh_branch: 'mesh-sync',
      replicas: 4,
      tags: ['core', 'primary-router', 'cortex'],
      description: 'Master multimodal orchestration neuron coordinating multi-repo graph topologies'
    }
  },
  {
    id: 'iben-genesis',
    version: '0.3.1',
    domain: 'generation',
    entrypoint: 'http://localhost:7002/api',
    capabilities: ['generate', 'evaluate', 'synthesize_lattice', 'prompt_forge'],
    dependencies: ['codecraft-engine', 'vector-vault-lake'],
    metadata: {
      author: 'Zachary Genesis Team',
      mesh_branch: 'mesh-sync',
      replicas: 3,
      tags: ['genesis', 'lattice', 'deep-synthesis'],
      description: 'High-order generation and genesis engine for generative models & structural synthesis'
    }
  },
  {
    id: 'codecraft-engine',
    version: '1.8.0',
    domain: 'codecraft',
    entrypoint: 'http://localhost:7003/api',
    capabilities: ['execute', 'refactor', 'ast_transform', 'build_sandbox', 'test_runner'],
    dependencies: ['eval-critic-sentinel'],
    metadata: {
      author: 'CodeCraft Labs',
      mesh_branch: 'mesh-sync',
      replicas: 5,
      tags: ['execution', 'sandbox', 'compiler'],
      description: 'Zero-sandbox code crafting, AST transformation, and automated verification engine'
    }
  },
  {
    id: 'apex-mesh-router',
    version: '3.1.0',
    domain: 'orchestration',
    entrypoint: 'http://localhost:7004/api',
    capabilities: ['route', 'load_balance', 'circuit_breaker', 'failover_switch'],
    dependencies: ['zero-trust-axon'],
    metadata: {
      author: 'Infra Mesh Guild',
      mesh_branch: 'mesh-sync',
      replicas: 6,
      tags: ['routing', 'high-availability'],
      description: 'High-throughput lowest-latency edge router and active failover broker'
    }
  },
  {
    id: 'vector-vault-lake',
    version: '4.2.0',
    domain: 'storage',
    entrypoint: 'http://localhost:7005/api',
    capabilities: ['query_embeddings', 'store_vectors', 'knn_search', 'graph_persist'],
    dependencies: [],
    metadata: {
      author: 'Storage Guild',
      mesh_branch: 'mesh-sync',
      replicas: 3,
      tags: ['vector-db', 'hsnw-index'],
      description: 'Distributed billion-vector index and persistent graph embedding store'
    }
  },
  {
    id: 'eval-critic-sentinel',
    version: '1.5.2',
    domain: 'evaluation',
    entrypoint: 'http://localhost:7006/api',
    capabilities: ['evaluate', 'benchmark', 'truth_verify', 'loss_audit'],
    dependencies: ['vector-vault-lake'],
    metadata: {
      author: 'QA & Safety Division',
      mesh_branch: 'mesh-sync',
      replicas: 2,
      tags: ['safety', 'benchmarking', 'arbiter'],
      description: 'Automated ground-truth verification and perceptual output quality evaluator'
    }
  },
  {
    id: 'zero-trust-axon',
    version: '2.0.4',
    domain: 'security',
    entrypoint: 'http://localhost:7007/api',
    capabilities: ['authenticate', 'authorize_signal', 'encrypt_payload', 'audit_hash'],
    dependencies: [],
    metadata: {
      author: 'Security Core',
      mesh_branch: 'mesh-sync',
      replicas: 3,
      tags: ['zero-trust', 'cryptography', 'mfa'],
      description: 'Zero-trust handshake gatekeeper and HMAC-SHA256 signal verification axon'
    }
  },
  {
    id: 'tensor-blade-infer',
    version: '5.0.1',
    domain: 'inference',
    entrypoint: 'http://localhost:7008/api',
    capabilities: ['infer_batch', 'quantize_int4', 'stream_tokens', 'speculative_decode'],
    dependencies: ['vector-vault-lake'],
    metadata: {
      author: 'Compute Systems',
      mesh_branch: 'mesh-sync',
      replicas: 8,
      tags: ['vllm', 'gpu-cluster', 'streaming'],
      description: 'Ultra-low latency tensor inference cluster with speculative decoding support'
    }
  }
];

const DOMAINS: NeuronManifest['domain'][] = [
  'orchestration',
  'generation',
  'codecraft',
  'inference',
  'storage',
  'evaluation',
  'agentics',
  'security',
  'interface',
  'analytics'
];

const DOMAIN_CAPABILITIES: Record<NeuronManifest['domain'], string[]> = {
  orchestration: ['route', 'compose', 'analyze', 'thread_pathway', 'dynamic_balance', 'fan_out', 'barrier_sync'],
  generation: ['generate', 'synthesize_lattice', 'prompt_forge', 'diff_synthesize', 'multimodal_embed'],
  codecraft: ['execute', 'refactor', 'ast_transform', 'build_sandbox', 'test_runner', 'lint_scan'],
  inference: ['infer_batch', 'quantize_int4', 'stream_tokens', 'speculative_decode', 'tensor_fuse'],
  storage: ['query_embeddings', 'store_vectors', 'knn_search', 'graph_persist', 'replicate_shards'],
  evaluation: ['evaluate', 'benchmark', 'truth_verify', 'loss_audit', 'hallucination_guard'],
  agentics: ['plan_subtasks', 'delegate_agent', 'tool_broker', 'memory_reflect', 'goal_converge'],
  security: ['authenticate', 'authorize_signal', 'encrypt_payload', 'audit_hash', 'sanitize_ast'],
  interface: ['render_canvas', 'dispatch_event', 'stream_sse', 'websocket_relay', 'ui_bridge'],
  analytics: ['aggregate_metrics', 'detect_anomalies', 'forecast_capacity', 'trace_telemetry']
};

const REPO_NAME_PREFIXES: Record<NeuronManifest['domain'], string[]> = {
  orchestration: ['nexus-router', 'cortex-gate', 'synapse-weaver', 'mesh-conductor', 'axon-dispatcher', 'flow-matrix', 'entangled-hub'],
  generation: ['lattice-synth', 'genesis-forge', 'diff-creator', 'omni-alchemist', 'neural-sculptor', 'prompt-matrix', 'hyper-weaver'],
  codecraft: ['code-loom', 'ast-rewriter', 'sandbox-isolate', 'test-sentinel', 'compiler-node', 'patch-engine', 'refactor-bot'],
  inference: ['tensor-blade', 'vllm-shard', 'triton-stream', 'quant-engine', 'neural-accelerator', 'blade-cluster', 'infer-node'],
  storage: ['vector-lake', 'embedding-vault', 'synapse-store', 'kv-mesh-cache', 'cold-archive', 'graph-db-node', 'state-persist'],
  evaluation: ['truth-arbiter', 'metric-probe', 'benchmark-rig', 'eval-critic', 'guardrail-node', 'loss-scanner', 'accuracy-watch'],
  agentics: ['subagent-cortex', 'tool-broker', 'planner-node', 'agent-swarm', 'task-decomposer', 'memory-agent', 'goal-arbiter'],
  security: ['shield-gateway', 'zero-trust-gate', 'audit-sentinel', 'crypto-vault', 'tamper-guard', 'policy-enforcer', 'cert-synapse'],
  interface: ['canvas-relay', 'telemetry-bridge', 'tampermonkey-hook', 'ai-studio-bridge', 'websocket-mesh', 'ui-socket', 'stream-hub'],
  analytics: ['trend-forecaster', 'latency-radar', 'anomaly-seeker', 'throughput-calc', 'mesh-telemetry', 'trace-collector', 'capacity-planner']
};

export function generate256Neurons(): NeuronNode[] {
  const nodes: NeuronNode[] = [];
  const TOTAL_NODES = 256;

  // Add the primary anchor nodes
  for (let i = 0; i < PRIMARY_NEURONS.length; i++) {
    const p = PRIMARY_NEURONS[i];
    const manifest: NeuronManifest = {
      id: p.id!,
      version: p.version || '1.0.0',
      domain: p.domain || 'orchestration',
      entrypoint: p.entrypoint || `http://localhost:${7000 + i}/api`,
      capabilities: p.capabilities || ['route'],
      dependencies: p.dependencies || [],
      metadata: {
        author: p.metadata?.author || 'Neural Core Team',
        mesh_branch: 'mesh-sync',
        replicas: p.metadata?.replicas || 2,
        tags: p.metadata?.tags || ['production'],
        description: p.metadata?.description || `Core neuron node ${p.id}`
      }
    };

    nodes.push({
      manifest,
      status: 'online',
      health: {
        latency_ms: 12 + Math.floor(Math.random() * 25),
        error_rate: 0.00,
        cpu_pct: 18 + Math.floor(Math.random() * 30),
        memory_mb: 256 + Math.floor(Math.random() * 512),
        uptime_sec: 86400 * (3 + Math.floor(Math.random() * 30)),
        last_heartbeat: new Date().toISOString(),
        requests_per_sec: 80 + Math.floor(Math.random() * 220),
        active_synapses: 12 + Math.floor(Math.random() * 20)
      },
      registered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * (10 + i)).toISOString()
    });
  }

  // Generate remaining nodes to reach exactly 256
  const remainingCount = TOTAL_NODES - nodes.length;

  for (let i = 0; i < remainingCount; i++) {
    const domain = DOMAINS[i % DOMAINS.length];
    const prefixList = REPO_NAME_PREFIXES[domain];
    const prefix = prefixList[i % prefixList.length];
    const indexSuffix = Math.floor(i / prefixList.length) + 1;
    const id = `${prefix}-${indexSuffix < 10 ? '0' + indexSuffix : indexSuffix}`;
    const port = 7010 + i;

    // Pick 2-4 capabilities from this domain and occasionally 1 cross-domain
    const availableCaps = [...DOMAIN_CAPABILITIES[domain]];
    const capsCount = 2 + (i % 3);
    const selectedCaps = availableCaps.slice(0, capsCount);
    if (i % 5 === 0) {
      selectedCaps.push('route');
    }

    // Pick 1-3 dependencies among earlier nodes
    const dependencies: string[] = [];
    if (nodes.length > 0) {
      const depTarget1 = nodes[Math.floor(Math.random() * nodes.length)].manifest.id;
      dependencies.push(depTarget1);
      if (Math.random() > 0.4 && nodes.length > 3) {
        const depTarget2 = nodes[Math.floor(Math.random() * nodes.length)].manifest.id;
        if (depTarget2 !== depTarget1) dependencies.push(depTarget2);
      }
    }

    // Assign realistic status (vast majority online, few degraded, 1-2 offline/failover)
    let status: NeuronNode['status'] = 'online';
    let latency = 8 + Math.floor(Math.random() * 45);
    let errorRate = Math.random() < 0.85 ? 0.00 : parseFloat((Math.random() * 0.02).toFixed(3));

    if (i === 14 || i === 42 || i === 89) {
      status = 'degraded';
      latency = 120 + Math.floor(Math.random() * 180);
      errorRate = 0.08 + parseFloat((Math.random() * 0.05).toFixed(3));
    } else if (i === 104) {
      status = 'failover_standby';
      latency = 15;
    } else if (i === 177) {
      status = 'offline';
      latency = 999;
      errorRate = 1.0;
    }

    const manifest: NeuronManifest = {
      id,
      version: `1.${(i % 12)}.${(i % 5)}`,
      domain,
      entrypoint: `http://localhost:${port}/api`,
      capabilities: selectedCaps,
      dependencies,
      metadata: {
        author: `Neuron Cell Alpha-${(i % 8) + 1}`,
        mesh_branch: 'mesh-sync',
        replicas: 1 + (i % 4),
        tags: [domain, 'mesh-sync', `shard-${i % 16}`],
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
        last_heartbeat: new Date(Date.now() - (status === 'offline' ? 3600000 : Math.floor(Math.random() * 15000))).toISOString(),
        requests_per_sec: status === 'offline' ? 0 : 20 + Math.floor(Math.random() * 180),
        active_synapses: 4 + Math.floor(Math.random() * 16)
      },
      registered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * (5 + (i % 60))).toISOString(),
      failover_target: status === 'degraded' || status === 'offline' ? 'apex-mesh-router' : undefined,
      circuit_tripped: status === 'offline'
    });
  }

  return nodes;
}
