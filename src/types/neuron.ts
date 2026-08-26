export interface NeuronMetadata {
  author?: string;
  mesh_branch: string;
  replicas?: number;
  circuit_breaker?: {
    failure_threshold: number;
    cooldown_sec: number;
  };
  tags?: string[];
  description?: string;
}

export interface NeuronManifest {
  $schema?: string;
  id: string;
  version: string;
  domain: 'orchestration' | 'generation' | 'codecraft' | 'inference' | 'storage' | 'evaluation' | 'agentics' | 'security' | 'interface' | 'analytics';
  entrypoint: string;
  capabilities: string[];
  dependencies: string[];
  metadata?: NeuronMetadata;
}

export interface NeuronHealth {
  latency_ms: number;
  error_rate: number;
  cpu_pct?: number;
  memory_mb?: number;
  uptime_sec?: number;
  last_heartbeat: string;
  requests_per_sec?: number;
  active_synapses?: number;
}

export type NeuronStatus = 'online' | 'degraded' | 'offline' | 'failover_standby';

export interface NeuronNode {
  manifest: NeuronManifest;
  status: NeuronStatus;
  health: NeuronHealth;
  registered_at: string;
  failover_target?: string;
  circuit_tripped?: boolean;
}

export interface PathwayStep {
  neuronId: string;
  capability: string;
  timeout_ms?: number;
  fallbackNeuronId?: string;
  input_mapping?: string;
}

export interface PathwayDefinition {
  id: string;
  name: string;
  description: string;
  steps: PathwayStep[];
  routing_policy: 'least_latency' | 'round_robin' | 'weighted_health' | 'failover_priority';
  created_at: string;
  tags?: string[];
}

export interface StepExecutionLog {
  step_index: number;
  neuron_id: string;
  capability: string;
  status: 'success' | 'failed' | 'fallback_used';
  latency_ms: number;
  input_payload: any;
  output_payload: any;
  executed_at: string;
  error?: string;
}

export interface PathwayExecutionResult {
  trace_id: string;
  pathway_id: string;
  status: 'success' | 'failed' | 'partial_degraded';
  started_at: string;
  completed_at: string;
  total_latency_ms: number;
  steps: StepExecutionLog[];
  initial_payload: any;
  final_output: any;
  audit_hash: string;
}

export interface MessageEnvelope {
  pathway_id?: string;
  source: string;
  target: string;
  signal_type: 'request' | 'response' | 'heartbeat' | 'alert' | 'handshake' | 'failover_trigger' | 'sync';
  payload: Record<string, any>;
  trace_id: string;
  timestamp: string;
  hop_count: number;
  latency_ms?: number;
}

export interface MetricSnapshot {
  timestamp: string;
  total_requests: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  error_rate_pct: number;
  active_nodes: number;
  degraded_nodes: number;
  offline_nodes: number;
  axon_throughput_kbps: number;
  circuit_trips: number;
}

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  neuron_id?: string;
  pathway_id?: string;
  timestamp: string;
  acknowledged: boolean;
  auto_mitigated: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  role: 'admin' | 'architect' | 'operator' | 'viewer';
  details: string;
  timestamp: string;
  hash: string;
  ip_address?: string;
}

export type UserRole = 'admin' | 'architect' | 'operator' | 'viewer';
