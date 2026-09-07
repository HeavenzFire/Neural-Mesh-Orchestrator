# Deployment Guide: Continuity Core

## 🚀 Quick Start

### 1. Run the Simulation (Standalone)
See the hive autonomously stabilize infrastructure during a crisis:

```bash
cd continuity_core
python agents/hive_engine.py
```

### 2. Launch the API Server (Production Mode)
Expose Continuity Core as a service for enterprise integration:

```bash
cd continuity_core
pip install fastapi uvicorn
python api/server.py
```

The API will be available at `http://localhost:8000`

---

## 🔌 API Endpoints

### Health Check
```bash
curl http://localhost:8000/
```

### Get Real-Time Coherence Metrics
```bash
curl http://localhost:8000/coherence
```

**Response:**
```json
{
  "overall_score": 0.89,
  "node_scores": {"node_0": 0.91, "node_1": 0.87, ...},
  "active_threats": 0,
  "timestamp": "2026-09-07T15:17:53.969432"
}
```

### Register a New Infrastructure Node
```bash
curl -X POST http://localhost:8000/nodes/register \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "grid_substation_42",
    "node_type": "power_grid",
    "capacity": 500.0,
    "initial_load": 0.6,
    "connections": ["grid_substation_41", "data_center_7"]
  }'
```

### Request Autonomous Intervention
```bash
curl -X POST http://localhost:8000/intervene \
  -H "Content-Type: application/json" \
  -d '{
    "target_node": "grid_substation_42",
    "action": "REDISTRIBUTE_LOAD",
    "priority": "critical"
  }'
```

**Response:**
```json
{
  "intervention_id": "754e78e9-12b8-4875-aacc-b9c0ef0a5fb0",
  "status": "initiated",
  "target": "grid_substation_42",
  "action": "REDISTRIBUTE_LOAD",
  "estimated_completion": "2-5 seconds"
}
```

### Simulate Crisis (Testing Only)
```bash
curl http://localhost:8000/simulate/crisis
```

⚠️ **Warning**: This endpoint injects failures into nodes. Do not use in production.

### Get Intervention History
```bash
curl http://localhost:8000/history
```

---

## 🏗️ Architecture

```
continuity_core/
├── agents/
│   └── hive_engine.py      # Core hive logic, agents, simulation
├── api/
│   └── server.py           # FastAPI REST interface
├── simulation/             # (Future) Advanced scenario testing
├── README.md               # Business model & vision
└── DEPLOYMENT.md           # This file
```

---

## 🛡️ Production Hardening Checklist

Before deploying to critical infrastructure:

- [ ] **Authentication**: Add API key or OAuth2 middleware to all endpoints
- [ ] **Rate Limiting**: Implement request throttling per client
- [ ] **Audit Logging**: Log all interventions with timestamps and actor IDs
- [ ] **Encryption**: Enable TLS/SSL for all communications
- [ ] **Redundancy**: Deploy multiple hive instances with consensus voting
- [ ] **Human-in-the-Loop**: Require manual approval for high-priority interventions
- [ ] **Monitoring**: Integrate with Prometheus/Grafana for real-time observability
- [ ] **Fail-Safe**: Implement emergency shutdown if coherence drops below threshold

---

## 💼 Integration Patterns

### Pattern 1: Municipal Grid Operator
- Deploy Continuity Core as a sidecar to SCADA systems
- Agents monitor transformer load, frequency stability, and demand spikes
- Autonomous load shedding prevents cascading blackouts

### Pattern 2: Global Logistics Provider
- Register shipping hubs, warehouses, and fleet nodes
- Hive predicts bottlenecks from weather, port delays, or fuel shortages
- Auto-reroutes shipments before delays occur

### Pattern 3: Cloud Hyperscaler
- Embed SDK into data center orchestration layer
- Agents balance compute load across regions during outages
- Zero-downtime failover becomes automatic

---

## 📈 Scaling Strategy

| Phase | Nodes | Use Case | Revenue Model |
|-------|-------|----------|---------------|
| MVP | 10–100 | Single facility monitoring | Pilot contract ($50K–$200K) |
| Growth | 100–10,000 | Regional grid/logistics | CaaS subscription ($1M–$10M/yr) |
| Scale | 10,000–1M+ | National infrastructure | Sovereign contracts ($50M–$500M/yr) |
| Civilizational | 1M+ | Global mesh | Insurance underwriting + licensing |

---

## 🌐 The Invisible Utility

Continuity Core is designed to be **always on, always healing, and always invisible**. Success is measured not by alerts fired, but by disasters that never happened.

**Deploy it. Forget it. Trust it.**
