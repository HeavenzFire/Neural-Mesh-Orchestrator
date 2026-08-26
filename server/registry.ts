import crypto from 'crypto';
import {
  NeuronNode,
  NeuronManifest,
  NeuronHealth,
  PathwayDefinition,
  PathwayExecutionResult,
  StepExecutionLog,
  MessageEnvelope,
  MetricSnapshot,
  AlertItem,
  AuditLog
} from '../src/types/neuron.ts';
import { generate256Neurons } from './mockMesh.ts';

export class NeuralMeshRegistry {
  private nodes: Map<string, NeuronNode> = new Map();
  private pathways: Map<string, PathwayDefinition> = new Map();
  private executionHistory: PathwayExecutionResult[] = [];
  private messageBus: MessageEnvelope[] = [];
  private alerts: AlertItem[] = [];
  private auditLogs: AuditLog[] = [];
  private metricHistory: MetricSnapshot[] = [];
  private roundRobinCounters: Map<string, number> = new Map();

  constructor() {
    this.initializeMesh();
    this.seedDefaultPathways();
    this.seedInitialMetrics();
    this.startBackgroundHeartbeatSimulator();
  }

  private initializeMesh() {
    const initialNodes = generate256Neurons();
    for (const node of initialNodes) {
      this.nodes.set(node.manifest.id, node);
    }

    this.logAudit(
      'MESH_INITIALIZED',
      'system',
      'admin',
      `Initialized neural mesh cortex with 256 repository nodes across 10 functional domains.`
    );
  }

  private seedDefaultPathways() {
    const defaultPipelines: PathwayDefinition[] = [
      {
        id: 'orchestrated-lattice-build',
        name: 'Orchestrated Lattice Build',
        description: 'Multi-repo synthesis chain: routes prompt, synthesizes lattice body, transforms AST, and executes in sandbox.',
        steps: [
          { neuronId: 'entangled-multimodal-system-3', capability: 'route', timeout_ms: 120 },
          { neuronId: 'iben-genesis', capability: 'generate', fallbackNeuronId: 'lattice-synth-01', timeout_ms: 350 },
          { neuronId: 'codecraft-engine', capability: 'execute', fallbackNeuronId: 'code-loom-01', timeout_ms: 200 },
          { neuronId: 'eval-critic-sentinel', capability: 'evaluate', timeout_ms: 150 }
        ],
        routing_policy: 'least_latency',
        created_at: new Date().toISOString(),
        tags: ['synthesis', 'production', 'verified']
      },
      {
        id: 'fast-speculative-infer-chain',
        name: 'Speculative Token Stream & Embed',
        description: 'Dispatches high-frequency token inference, verifies embeddings in vector lake, and runs truth arbitration.',
        steps: [
          { neuronId: 'apex-mesh-router', capability: 'route', timeout_ms: 50 },
          { neuronId: 'tensor-blade-infer', capability: 'infer_batch', fallbackNeuronId: 'tensor-blade-01', timeout_ms: 180 },
          { neuronId: 'vector-vault-lake', capability: 'query_embeddings', timeout_ms: 90 },
          { neuronId: 'eval-critic-sentinel', capability: 'truth_verify', timeout_ms: 100 }
        ],
        routing_policy: 'weighted_health',
        created_at: new Date().toISOString(),
        tags: ['inference', 'realtime']
      },
      {
        id: 'zero-trust-codecraft-pipeline',
        name: 'Zero-Trust Secure AST Rewrite',
        description: 'Authenticates caller, refactors code AST, verifies security policy, and commits to mesh-sync branch.',
        steps: [
          { neuronId: 'zero-trust-axon', capability: 'authenticate', timeout_ms: 40 },
          { neuronId: 'codecraft-engine', capability: 'ast_transform', fallbackNeuronId: 'ast-rewriter-01', timeout_ms: 220 },
          { neuronId: 'eval-critic-sentinel', capability: 'loss_audit', timeout_ms: 120 },
          { neuronId: 'entangled-multimodal-system-3', capability: 'compose', timeout_ms: 90 }
        ],
        routing_policy: 'failover_priority',
        created_at: new Date().toISOString(),
        tags: ['security', 'compliance']
      }
    ];

    for (const p of defaultPipelines) {
      this.pathways.set(p.id, p);
    }
  }

  private seedInitialMetrics() {
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now - i * 3600000).toISOString();
      const jitter = Math.sin(i / 3) * 8;
      this.metricHistory.push({
        timestamp,
        total_requests: 12000 + Math.floor(Math.random() * 4000) + Math.floor(jitter * 200),
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

    // Seed sample initial alert
    this.alerts.push({
      id: 'alt-' + Math.random().toString(36).substring(2, 9),
      severity: 'warning',
      title: 'Latency Threshold Warning on Node',
      message: 'Node nexus-router-03 experienced temporary spike to 142ms (>100ms threshold). Auto-load rebalanced.',
      neuron_id: 'nexus-router-03',
      timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      acknowledged: false,
      auto_mitigated: true
    });
  }

  // Background heartbeat simulator
  private startBackgroundHeartbeatSimulator() {
    setInterval(() => {
      this.simulateMeshTick();
    }, 5000);
  }

  private simulateMeshTick() {
    // Slightly fluctuate some nodes
    const nodeKeys = Array.from(this.nodes.keys());
    if (nodeKeys.length === 0) return;

    // Pick 5 random nodes to update heartbeat and slight latency drift
    for (let i = 0; i < 5; i++) {
      const randomKey = nodeKeys[Math.floor(Math.random() * nodeKeys.length)];
      const node = this.nodes.get(randomKey);
      if (node && node.status !== 'offline') {
        const drift = (Math.random() - 0.5) * 4;
        const newLatency = Math.max(5, Math.min(300, Math.round(node.health.latency_ms + drift)));
        node.health.latency_ms = newLatency;
        node.health.last_heartbeat = new Date().toISOString();
        node.health.requests_per_sec = Math.max(5, Math.min(500, Math.round((node.health.requests_per_sec || 50) + (Math.random() - 0.5) * 10)));
      }
    }

    // Append axon heartbeat event
    if (Math.random() > 0.4) {
      const sampleNode = nodeKeys[Math.floor(Math.random() * nodeKeys.length)];
      this.emitMessage({
        source: sampleNode,
        target: 'cortex-registry',
        signal_type: 'heartbeat',
        payload: { status: 'healthy', jitter_ms: Math.floor(Math.random() * 5) },
        trace_id: 'hb-' + Math.random().toString(36).substring(2, 8),
        timestamp: new Date().toISOString(),
        hop_count: 1
      });
    }
  }

  // --- REGISTRATION & HANDSHAKE ---

  public registerNeuron(manifest: NeuronManifest, status: NeuronNode['status'] = 'online'): NeuronNode {
    if (!manifest.id || !manifest.version || !manifest.domain || !manifest.entrypoint || !manifest.capabilities) {
      throw new Error('Invalid neuron.json schema: missing required fields id, version, domain, entrypoint, or capabilities.');
    }

    const existing = this.nodes.get(manifest.id);
    const node: NeuronNode = {
      manifest: {
        ...manifest,
        dependencies: manifest.dependencies || [],
        metadata: {
          mesh_branch: manifest.metadata?.mesh_branch || 'mesh-sync',
          author: manifest.metadata?.author || 'Community Node',
          replicas: manifest.metadata?.replicas || 1,
          tags: manifest.metadata?.tags || [manifest.domain],
          description: manifest.metadata?.description || `Neuron node ${manifest.id}`
        }
      },
      status: status || 'online',
      health: {
        latency_ms: existing ? existing.health.latency_ms : 15 + Math.floor(Math.random() * 20),
        error_rate: existing ? existing.health.error_rate : 0.00,
        cpu_pct: 22,
        memory_mb: 256,
        uptime_sec: existing ? existing.health.uptime_sec : 1,
        last_heartbeat: new Date().toISOString(),
        requests_per_sec: 10,
        active_synapses: manifest.dependencies.length + 2
      },
      registered_at: existing ? existing.registered_at : new Date().toISOString(),
      failover_target: undefined,
      circuit_tripped: false
    };

    this.nodes.set(manifest.id, node);

    this.logAudit(
      existing ? 'NEURON_UPDATED' : 'NEURON_REGISTERED',
      manifest.metadata?.author || 'mesh-api',
      'architect',
      `Registered neuron ${manifest.id} (domain: ${manifest.domain}, capabilities: [${manifest.capabilities.join(', ')}])`
    );

    this.emitMessage({
      source: manifest.id,
      target: 'cortex-registry',
      signal_type: 'handshake',
      payload: { action: 'register', version: manifest.version, domain: manifest.domain },
      trace_id: 'reg-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      hop_count: 1
    });

    return node;
  }

  public recordHandshake(neuronId: string, data: { status?: NeuronNode['status']; health?: Partial<NeuronHealth> }): NeuronNode {
    const node = this.nodes.get(neuronId);
    if (!node) {
      throw new Error(`Neuron '${neuronId}' not found in cortex registry.`);
    }

    if (data.status) {
      node.status = data.status;
    }

    if (data.health) {
      if (typeof data.health.latency_ms === 'number') node.health.latency_ms = data.health.latency_ms;
      if (typeof data.health.error_rate === 'number') node.health.error_rate = data.health.error_rate;
      if (typeof data.health.cpu_pct === 'number') node.health.cpu_pct = data.health.cpu_pct;
      if (typeof data.health.memory_mb === 'number') node.health.memory_mb = data.health.memory_mb;
      if (typeof data.health.requests_per_sec === 'number') node.health.requests_per_sec = data.health.requests_per_sec;
    }

    node.health.last_heartbeat = new Date().toISOString();

    // Check if latency or error rate triggers alert
    if (node.health.latency_ms > 120 && node.status !== 'offline') {
      this.triggerAlert('warning', `High Latency Detected on ${node.manifest.id}`, `Node latency reached ${node.health.latency_ms}ms (threshold: 100ms)`, node.manifest.id);
    }
    if (node.health.error_rate > 0.05 && node.status !== 'offline') {
      this.triggerAlert('critical', `Elevated Error Rate on ${node.manifest.id}`, `Error rate spiked to ${(node.health.error_rate * 100).toFixed(1)}%`, node.manifest.id);
    }

    return node;
  }

  public getNeurons(filters?: { domain?: string; capability?: string; status?: string; search?: string }): NeuronNode[] {
    let result = Array.from(this.nodes.values());

    if (filters) {
      if (filters.domain) {
        result = result.filter(n => n.manifest.domain.toLowerCase() === filters.domain!.toLowerCase());
      }
      if (filters.capability) {
        result = result.filter(n => n.manifest.capabilities.some(c => c.toLowerCase().includes(filters.capability!.toLowerCase())));
      }
      if (filters.status) {
        result = result.filter(n => n.status.toLowerCase() === filters.status!.toLowerCase());
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(n =>
          n.manifest.id.toLowerCase().includes(q) ||
          n.manifest.domain.toLowerCase().includes(q) ||
          n.manifest.capabilities.some(c => c.toLowerCase().includes(q)) ||
          (n.manifest.metadata?.description || '').toLowerCase().includes(q)
        );
      }
    }

    return result;
  }

  public getNeuronById(id: string): NeuronNode | undefined {
    return this.nodes.get(id);
  }

  public deleteNeuron(id: string): boolean {
    const deleted = this.nodes.delete(id);
    if (deleted) {
      this.logAudit('NEURON_DEREGISTERED', 'operator', 'operator', `Deregistered neuron ${id} from mesh`);
    }
    return deleted;
  }

  // --- PATHWAY ROUTING ENGINE & GRAPH TRAVERSAL ---

  public findPathways(fromNeuronId: string, toNeuronId: string, requiredCaps?: string[]): {
    direct_available: boolean;
    recommended_path: string[];
    alternative_paths: string[][];
    estimated_latency_ms: number;
  } {
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

    // BFS / Dijkstra-style path exploration using dependency and capability bridges
    const paths: string[][] = [];
    const queue: { current: string; path: string[]; latency: number }[] = [
      { current: fromNeuronId, path: [fromNeuronId], latency: startNode.health.latency_ms }
    ];
    const visited = new Set<string>();

    while (queue.length > 0 && paths.length < 5) {
      const { current, path, latency } = queue.shift()!;
      if (current === toNeuronId && path.length > 1) {
        paths.push(path);
        continue;
      }

      visited.add(current);
      const currNode = this.nodes.get(current);
      if (!currNode) continue;

      // Check direct dependencies
      const neighbors = new Set<string>(currNode.manifest.dependencies || []);

      // Also connect to nodes in compatible domains or shared capabilities
      for (const node of this.nodes.values()) {
        if (node.status === 'offline') continue;
        if (currNode.manifest.capabilities.some(c => node.manifest.capabilities.includes(c)) ||
            (currNode.manifest.domain === 'orchestration' && node.manifest.domain !== 'orchestration')) {
          if (neighbors.size < 8) {
            neighbors.add(node.manifest.id);
          }
        }
      }

      for (const next of neighbors) {
        if (!path.includes(next) && path.length < 6) {
          const nextNode = this.nodes.get(next);
          if (nextNode && nextNode.status !== 'offline') {
            queue.push({
              current: next,
              path: [...path, next],
              latency: latency + nextNode.health.latency_ms
            });
          }
        }
      }
    }

    // If no direct graph path discovered, weave dynamic bridge via orchestrator
    if (paths.length === 0) {
      paths.push([fromNeuronId, 'entangled-multimodal-system-3', toNeuronId]);
    }

    // Sort by path length and total latency
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

  public getPathways(): PathwayDefinition[] {
    return Array.from(this.pathways.values());
  }

  public getPathwayById(id: string): PathwayDefinition | undefined {
    return this.pathways.get(id);
  }

  public savePathway(pathway: PathwayDefinition): PathwayDefinition {
    if (!pathway.id || !pathway.name || !pathway.steps || pathway.steps.length === 0) {
      throw new Error('Pathway must have id, name, and at least one step.');
    }
    pathway.created_at = pathway.created_at || new Date().toISOString();
    this.pathways.set(pathway.id, pathway);

    this.logAudit('PATHWAY_CONFIGURED', 'architect', 'architect', `Configured pathway ${pathway.id} with ${pathway.steps.length} threaded steps.`);
    return pathway;
  }

  public deletePathway(id: string): boolean {
    return this.pathways.delete(id);
  }

  // --- PATHWAY EXECUTION & AXON SIGNALLING ---

  public async executePathway(
    pathwayId: string,
    initialPayload: Record<string, any> = { prompt: 'Execute neural synthesis', context: { requester: 'zachary' } }
  ): Promise<PathwayExecutionResult> {
    const pathway = this.pathways.get(pathwayId);
    if (!pathway) {
      throw new Error(`Pathway '${pathwayId}' not registered in mesh.`);
    }

    const traceId = 'tr-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
    const startedAt = new Date().toISOString();
    const stepsLog: StepExecutionLog[] = [];
    let currentPayload = { ...initialPayload };
    let overallSuccess = true;
    let totalLatency = 0;

    for (let i = 0; i < pathway.steps.length; i++) {
      const step = pathway.steps[i];
      let targetNeuron = this.nodes.get(step.neuronId);
      let usedFallback = false;

      // Failover handling
      if (!targetNeuron || targetNeuron.status === 'offline' || (targetNeuron.status === 'degraded' && step.fallbackNeuronId)) {
        if (step.fallbackNeuronId && this.nodes.has(step.fallbackNeuronId)) {
          targetNeuron = this.nodes.get(step.fallbackNeuronId);
          usedFallback = true;
          this.triggerAlert('warning', `Failover Route Active on Step ${i + 1}`, `Primary neuron ${step.neuronId} unavailable. Routed to standby ${step.fallbackNeuronId}.`, step.neuronId, pathwayId);
        }
      }

      const stepNeuronId = targetNeuron ? targetNeuron.manifest.id : step.neuronId;
      const stepLatency = targetNeuron ? Math.max(5, targetNeuron.health.latency_ms + Math.floor((Math.random() - 0.5) * 6)) : 50;
      totalLatency += stepLatency;

      // Emit axon request envelope
      const reqEnvelope: MessageEnvelope = {
        pathway_id: pathwayId,
        source: i === 0 ? 'client-ingress' : pathway.steps[i - 1].neuronId,
        target: stepNeuronId,
        signal_type: 'request',
        payload: currentPayload,
        trace_id: traceId,
        timestamp: new Date().toISOString(),
        hop_count: i + 1,
        latency_ms: stepLatency
      };
      this.emitMessage(reqEnvelope);

      // Simulate payload evolution along the neural pipeline
      const stepOutput: Record<string, any> = {
        ...currentPayload,
        step_completed: i + 1,
        processed_by: stepNeuronId,
        capability_executed: step.capability,
        timestamp: new Date().toISOString()
      };

      if (step.capability === 'route') {
        stepOutput.route_plan = ['entangled-multimodal-system-3', 'iben-genesis', 'codecraft-engine'];
        stepOutput.optimal_load_factor = 0.94;
      } else if (step.capability === 'generate' || step.capability === 'synthesize_lattice') {
        stepOutput.generated_lattice = {
          lattice_id: 'lat-' + Math.random().toString(36).substring(2, 7),
          nodes_synthesized: 64,
          tensor_dimensions: [512, 768],
          confidence: 0.992
        };
      } else if (step.capability === 'execute' || step.capability === 'ast_transform') {
        stepOutput.execution_sandbox = {
          status: 'verified',
          exit_code: 0,
          memory_peak_kb: 48200,
          ast_nodes_rewritten: 312
        };
      } else if (step.capability === 'evaluate' || step.capability === 'truth_verify') {
        stepOutput.eval_score = 0.988;
        stepOutput.guardrail_passed = true;
        stepOutput.loss_metric = 0.012;
      }

      currentPayload = stepOutput;

      // Emit axon response envelope
      this.emitMessage({
        pathway_id: pathwayId,
        source: stepNeuronId,
        target: i === pathway.steps.length - 1 ? 'client-egress' : pathway.steps[i + 1].neuronId,
        signal_type: usedFallback ? 'failover_trigger' : 'response',
        payload: { status: 'ok', capability: step.capability, result_summary: `Executed ${step.capability} in ${stepLatency}ms` },
        trace_id: traceId,
        timestamp: new Date().toISOString(),
        hop_count: i + 1,
        latency_ms: stepLatency
      });

      stepsLog.push({
        step_index: i + 1,
        neuron_id: stepNeuronId,
        capability: step.capability,
        status: usedFallback ? 'fallback_used' : 'success',
        latency_ms: stepLatency,
        input_payload: reqEnvelope.payload,
        output_payload: stepOutput,
        executed_at: new Date().toISOString()
      });
    }

    const completedAt = new Date().toISOString();
    const auditHash = crypto.createHash('sha256').update(traceId + startedAt + JSON.stringify(currentPayload)).digest('hex');

    const result: PathwayExecutionResult = {
      trace_id: traceId,
      pathway_id: pathwayId,
      status: overallSuccess ? 'success' : 'failed',
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
      'PATHWAY_EXECUTED',
      'pathway-engine',
      'operator',
      `Executed pathway '${pathwayId}' with trace ${traceId} across ${stepsLog.length} hops in ${totalLatency}ms (Hash: ${auditHash.substring(0, 10)}...)`
    );

    return result;
  }

  public getExecutionHistory(): PathwayExecutionResult[] {
    return this.executionHistory;
  }

  // --- AXON MESSAGE BUS ---

  public emitMessage(envelope: MessageEnvelope) {
    this.messageBus.unshift(envelope);
    if (this.messageBus.length > 500) {
      this.messageBus.pop();
    }
  }

  public getMessageBus(limit = 100, filterType?: string, traceId?: string): MessageEnvelope[] {
    let list = this.messageBus;
    if (filterType) {
      list = list.filter(m => m.signal_type === filterType);
    }
    if (traceId) {
      list = list.filter(m => m.trace_id === traceId);
    }
    return list.slice(0, limit);
  }

  // --- OBSERVABILITY, METRICS & ALERTS ---

  public getMetricsOverview() {
    const nodesList = Array.from(this.nodes.values());
    const online = nodesList.filter(n => n.status === 'online').length;
    const degraded = nodesList.filter(n => n.status === 'degraded').length;
    const offline = nodesList.filter(n => n.status === 'offline').length;
    const standby = nodesList.filter(n => n.status === 'failover_standby').length;

    const latencies = nodesList.map(n => n.health.latency_ms).filter(l => l < 500);
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
      active_alerts_count: this.alerts.filter(a => !a.acknowledged).length,
      axon_queue_size: this.messageBus.length,
      total_pathways_configured: this.pathways.size,
      total_traces_recorded: this.executionHistory.length
    };
  }

  public getMetricTrends(): MetricSnapshot[] {
    return this.metricHistory;
  }

  public getAlerts(): AlertItem[] {
    return this.alerts;
  }

  public acknowledgeAlert(id: string): boolean {
    const a = this.alerts.find(item => item.id === id);
    if (a) {
      a.acknowledged = true;
      this.logAudit('ALERT_ACKNOWLEDGED', 'operator', 'operator', `Acknowledged alert: ${a.title}`);
      return true;
    }
    return false;
  }

  public triggerAlert(severity: AlertItem['severity'], title: string, message: string, neuronId?: string, pathwayId?: string) {
    const alertItem: AlertItem = {
      id: 'alt-' + Math.random().toString(36).substring(2, 9),
      severity,
      title,
      message,
      neuron_id: neuronId,
      pathway_id: pathwayId,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      auto_mitigated: severity !== 'critical'
    };
    this.alerts.unshift(alertItem);
    if (this.alerts.length > 100) this.alerts.pop();

    this.emitMessage({
      source: neuronId || 'mesh-monitor',
      target: 'alert-dispatcher',
      signal_type: 'alert',
      payload: { severity, title, message },
      trace_id: 'alt-tr-' + alertItem.id,
      timestamp: alertItem.timestamp,
      hop_count: 1
    });
  }

  // --- COMPLIANCE AUDIT & SECURITY ---

  public logAudit(action: string, actor: string, role: AuditLog['role'], details: string) {
    const timestamp = new Date().toISOString();
    const prevHash = this.auditLogs.length > 0 ? this.auditLogs[0].hash : '00000000000000000000000000000000';
    const hash = crypto.createHash('sha256').update(prevHash + action + actor + details + timestamp).digest('hex');

    const log: AuditLog = {
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      action,
      actor,
      role,
      details,
      timestamp,
      hash,
      ip_address: '10.240.0.1 (Mesh Ingress)'
    };

    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  // --- LOAD & FAILURE SIMULATION ---

  public simulateLoadBurst() {
    for (const node of this.nodes.values()) {
      if (node.status === 'online') {
        node.health.requests_per_sec = Math.round((node.health.requests_per_sec || 50) * (1.5 + Math.random() * 2));
        node.health.latency_ms = Math.round(node.health.latency_ms * 1.3);
      }
    }
    this.triggerAlert('warning', 'Traffic Surge Injected', 'Simulated 250% load burst across mesh topology.');
    this.logAudit('SIMULATION_LOAD_BURST', 'operator', 'admin', 'Triggered traffic surge across all 256 nodes.');
  }

  public injectNodeFailure(neuronId: string) {
    const node = this.nodes.get(neuronId);
    if (node) {
      node.status = 'offline';
      node.circuit_tripped = true;
      node.health.latency_ms = 999;
      node.health.error_rate = 1.0;
      this.triggerAlert('critical', `Node Failure Injected: ${neuronId}`, `Node ${neuronId} marked OFFLINE. Circuit breaker tripped.`, neuronId);
      this.logAudit('SIMULATION_NODE_FAILURE', 'operator', 'admin', `Simulated failure on node ${neuronId}`);
    }
  }

  public recoverNode(neuronId: string) {
    const node = this.nodes.get(neuronId);
    if (node) {
      node.status = 'online';
      node.circuit_tripped = false;
      node.health.latency_ms = 18 + Math.floor(Math.random() * 15);
      node.health.error_rate = 0.00;
      node.health.last_heartbeat = new Date().toISOString();
      this.logAudit('NODE_RECOVERED', 'operator', 'admin', `Restored node ${neuronId} to online state.`);
    }
  }
}

export const registry = new NeuralMeshRegistry();
