import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { registry } from './server/registry.ts';
import { optimizePathwayWithAI } from './server/geminiService.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- HEALTH CHECK ---
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      service: 'Neural Mesh Cortex Registry',
      nodes_count: registry.getNeurons().length,
      timestamp: new Date().toISOString()
    });
  });

  // --- 1. CAPABILITY REGISTRY & HANDSHAKE SPEC ---

  // POST /api/register (also supports POST /register)
  const handleRegister = (req: express.Request, res: express.Response) => {
    try {
      const manifest = req.body.manifest || req.body;
      const status = req.body.status || 'online';
      const node = registry.registerNeuron(manifest, status);
      res.status(201).json({
        success: true,
        message: `Neuron '${node.manifest.id}' successfully registered in Neural Mesh cortex.`,
        neuron: node
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
  app.post('/api/register', handleRegister);
  app.post('/register', handleRegister);

  // PATCH /api/handshake & POST /api/handshake (supports /handshake)
  const handleHandshake = (req: express.Request, res: express.Response) => {
    try {
      const { neuron_id, status, health } = req.body;
      if (!neuron_id) {
        return res.status(400).json({ success: false, error: 'Missing neuron_id in handshake payload.' });
      }
      const node = registry.recordHandshake(neuron_id, { status, health });
      res.json({
        success: true,
        message: 'Handshake synapse updated successfully.',
        neuron_id: node.manifest.id,
        status: node.status,
        health: node.health,
        acknowledged_at: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };
  app.patch('/api/handshake', handleHandshake);
  app.post('/api/handshake', handleHandshake);
  app.patch('/handshake', handleHandshake);
  app.post('/handshake', handleHandshake);

  // GET /api/neurons (supports /neurons)
  const handleGetNeurons = (req: express.Request, res: express.Response) => {
    const { domain, capability, status, search } = req.query;
    const nodes = registry.getNeurons({
      domain: domain as string,
      capability: capability as string,
      status: status as string,
      search: search as string
    });
    res.json({
      total: nodes.length,
      neurons: nodes
    });
  };
  app.get('/api/neurons', handleGetNeurons);
  app.get('/neurons', handleGetNeurons);

  // GET /api/neurons/:id
  app.get('/api/neurons/:id', (req, res) => {
    const node = registry.getNeuronById(req.params.id);
    if (!node) {
      return res.status(404).json({ success: false, error: 'Neuron node not found' });
    }
    res.json(node);
  });

  // DELETE /api/neurons/:id
  app.delete('/api/neurons/:id', (req, res) => {
    const ok = registry.deleteNeuron(req.params.id);
    res.json({ success: ok });
  });

  // POST /api/neurons/:id/toggle-failure (Simulate fault injection)
  app.post('/api/neurons/:id/toggle-failure', (req, res) => {
    const node = registry.getNeuronById(req.params.id);
    if (!node) return res.status(404).json({ success: false, error: 'Neuron not found' });

    if (node.status === 'offline') {
      registry.recoverNode(req.params.id);
    } else {
      registry.injectNodeFailure(req.params.id);
    }
    res.json({ success: true, node: registry.getNeuronById(req.params.id) });
  });

  // --- 2. PATHWAY ROUTING & THREADING ENGINE ---

  // GET /api/pathways (supports /pathways)
  const handleGetPathways = (req: express.Request, res: express.Response) => {
    const { from, to } = req.query;
    if (from && to) {
      const routing = registry.findPathways(from as string, to as string);
      return res.json(routing);
    }
    res.json({
      total: registry.getPathways().length,
      pathways: registry.getPathways()
    });
  };
  app.get('/api/pathways', handleGetPathways);
  app.get('/pathways', handleGetPathways);

  // GET /api/pathways/:id (supports /pathways/:id)
  const handleGetPathwayById = (req: express.Request, res: express.Response) => {
    const pathway = registry.getPathwayById(req.params.id);
    if (!pathway) return res.status(404).json({ success: false, error: 'Pathway not found' });
    res.json({ success: true, pathway });
  };
  app.get('/api/pathways/:id', handleGetPathwayById);
  app.get('/pathways/:id', handleGetPathwayById);

  // POST /api/pathways
  app.post('/api/pathways', (req, res) => {
    try {
      const saved = registry.savePathway(req.body);
      res.status(201).json({ success: true, pathway: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/pathways/:id
  app.delete('/api/pathways/:id', (req, res) => {
    const ok = registry.deletePathway(req.params.id);
    res.json({ success: ok });
  });

  // POST /api/pathways/execute (Simulate or execute multi-hop pipeline)
  app.post('/api/pathways/execute', async (req, res) => {
    try {
      const { pathway_id, payload } = req.body;
      if (!pathway_id) return res.status(400).json({ success: false, error: 'Missing pathway_id' });
      const result = await registry.executePathway(pathway_id, payload);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/pathways/history
  app.get('/api/pathways/history', (req, res) => {
    res.json({ history: registry.getExecutionHistory() });
  });

  // --- 3. AXON MESSAGE BUS & SIGNALS ---

  // POST /api/signal
  app.post('/api/signal', (req, res) => {
    try {
      const { source, target, signal_type, payload, pathway_id } = req.body;
      if (!source || !target || !signal_type) {
        return res.status(400).json({ success: false, error: 'Missing source, target, or signal_type' });
      }
      const envelope = {
        source,
        target,
        signal_type: signal_type || 'request',
        payload: payload || {},
        pathway_id,
        trace_id: 'sig-' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        hop_count: 1
      };
      registry.emitMessage(envelope as any);
      res.json({ success: true, envelope });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/bus/events
  app.get('/api/bus/events', (req, res) => {
    const { limit, type, trace_id } = req.query;
    const events = registry.getMessageBus(
      limit ? parseInt(limit as string) : 50,
      type as string,
      trace_id as string
    );
    res.json({ total: events.length, events });
  });

  // --- 4. OBSERVABILITY & METRICS ---

  app.get('/api/metrics/overview', (req, res) => {
    res.json(registry.getMetricsOverview());
  });

  app.get('/api/metrics/trends', (req, res) => {
    res.json({ trends: registry.getMetricTrends() });
  });

  app.get('/api/alerts', (req, res) => {
    res.json({ alerts: registry.getAlerts() });
  });

  app.post('/api/alerts/:id/ack', (req, res) => {
    const ok = registry.acknowledgeAlert(req.params.id);
    res.json({ success: ok });
  });

  app.post('/api/simulate-burst', (req, res) => {
    registry.simulateLoadBurst();
    res.json({ success: true, message: 'Traffic surge simulated across mesh.' });
  });

  // --- 5. AUDIT & COMPLIANCE ---

  app.get('/api/audit-logs', (req, res) => {
    res.json({ logs: registry.getAuditLogs() });
  });

  // --- 6. AI OPTIMIZATION ---

  app.post('/api/ai/optimize-pathway', async (req, res) => {
    try {
      const { goal, pathway_id } = req.body;
      const current = pathway_id ? registry.getPathways().find(p => p.id === pathway_id) : undefined;
      const optimization = await optimizePathwayWithAI(goal || 'Build optimized synthesis pathway', registry.getNeurons(), current);
      res.json({ success: true, optimization });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 7. EXPORT DATA ---

  app.get('/api/export', (req, res) => {
    const format = req.query.format || 'json';
    const meshData = {
      exported_at: new Date().toISOString(),
      nodes: registry.getNeurons(),
      pathways: registry.getPathways(),
      metrics: registry.getMetricsOverview(),
      audit_logs: registry.getAuditLogs()
    };

    if (format === 'csv') {
      const headers = ['id', 'domain', 'version', 'status', 'latency_ms', 'error_rate', 'capabilities', 'dependencies', 'entrypoint'];
      const rows = meshData.nodes.map(n => [
        n.manifest.id,
        n.manifest.domain,
        n.manifest.version,
        n.status,
        n.health.latency_ms,
        n.health.error_rate,
        `"${n.manifest.capabilities.join(';')}"`,
        `"${n.manifest.dependencies.join(';')}"`,
        n.manifest.entrypoint
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="neural-mesh-nodes.csv"');
      return res.send(csv);
    }

    res.json(meshData);
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Neural Mesh Cortex Router listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
