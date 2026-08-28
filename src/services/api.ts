import {
  NeuronNode,
  NeuronManifest,
  PathwayDefinition,
  PathwayExecutionResult,
  MessageEnvelope,
  MetricSnapshot,
  AlertItem,
  AuditLog
} from '../types/neuron.ts';

const LOCAL_STORAGE_CACHE_KEY = 'neural_mesh_cached_state';

export const MeshApi = {
  async getNeurons(filters?: { domain?: string; capability?: string; status?: string; search?: string }): Promise<NeuronNode[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.domain && filters.domain !== 'all') params.append('domain', filters.domain);
      if (filters?.capability) params.append('capability', filters.capability);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const res = await fetch(`/api/neurons?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch neurons');
      const data = await res.json();
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY + '_neurons', JSON.stringify(data.neurons));
      return data.neurons;
    } catch (err) {
      console.warn('Using cached neurons in offline mode:', err);
      const cached = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY + '_neurons');
      return cached ? JSON.parse(cached) : [];
    }
  },

  async getNeuron(id: string): Promise<NeuronNode> {
    const res = await fetch(`/api/neurons/${id}`);
    if (!res.ok) throw new Error('Neuron not found');
    return res.json();
  },

  async registerNeuron(manifest: NeuronManifest, status: string = 'online'): Promise<NeuronNode> {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manifest, status })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Registration failed');
    return data.neuron;
  },

  async sendHandshake(neuronId: string, status?: string, health?: any): Promise<any> {
    const res = await fetch('/api/handshake', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ neuron_id: neuronId, status, health })
    });
    return res.json();
  },

  async toggleNeuronFailure(id: string): Promise<NeuronNode> {
    const res = await fetch(`/api/neurons/${id}/toggle-failure`, { method: 'POST' });
    const data = await res.json();
    return data.node;
  },

  async getPathways(): Promise<PathwayDefinition[]> {
    const res = await fetch('/api/pathways');
    const data = await res.json();
    return data.pathways || [];
  },

  async getPathway(id: string): Promise<PathwayDefinition> {
    const res = await fetch(`/api/pathways/${id}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Pathway not found');
    return data.pathway;
  },

  async savePathway(pathway: PathwayDefinition): Promise<PathwayDefinition> {
    const res = await fetch('/api/pathways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pathway)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save pathway');
    return data.pathway;
  },

  async deletePathway(id: string): Promise<boolean> {
    const res = await fetch(`/api/pathways/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  async executePathway(pathwayId: string, payload: Record<string, any>): Promise<PathwayExecutionResult> {
    const res = await fetch('/api/pathways/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathway_id: pathwayId, payload })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Execution failed');
    return data.result;
  },

  async getExecutionHistory(): Promise<PathwayExecutionResult[]> {
    const res = await fetch('/api/pathways/history');
    const data = await res.json();
    return data.history || [];
  },

  async findRoutes(from: string, to: string): Promise<any> {
    const res = await fetch(`/api/pathways?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    return res.json();
  },

  async dispatchSignal(signal: { source: string; target: string; signal_type: string; payload: any; pathway_id?: string }): Promise<any> {
    const res = await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signal)
    });
    return res.json();
  },

  async getAxonEvents(limit = 60, type?: string): Promise<MessageEnvelope[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (type) params.append('type', type);
    const res = await fetch(`/api/bus/events?${params.toString()}`);
    const data = await res.json();
    return data.events || [];
  },

  async getMetricsOverview(): Promise<any> {
    const res = await fetch('/api/metrics/overview');
    return res.json();
  },

  async getMetricTrends(): Promise<MetricSnapshot[]> {
    const res = await fetch('/api/metrics/trends');
    const data = await res.json();
    return data.trends || [];
  },

  async getAlerts(): Promise<AlertItem[]> {
    const res = await fetch('/api/alerts');
    const data = await res.json();
    return data.alerts || [];
  },

  async acknowledgeAlert(id: string): Promise<boolean> {
    const res = await fetch(`/api/alerts/${id}/ack`, { method: 'POST' });
    const data = await res.json();
    return data.success;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    const data = await res.json();
    return data.logs || [];
  },

  async simulateLoadBurst(): Promise<any> {
    const res = await fetch('/api/simulate-burst', { method: 'POST' });
    return res.json();
  },

  async optimizePathwayWithAI(goal: string, pathwayId?: string): Promise<any> {
    const res = await fetch('/api/ai/optimize-pathway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, pathway_id: pathwayId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'AI Optimization failed');
    return data.optimization;
  }
};
