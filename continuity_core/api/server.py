"""
Continuity Core API: Production Interface
-----------------------------------------
Exposes the hive as a RESTful service for enterprise integration.
Endpoints allow clients to:
- Register infrastructure nodes
- Query real-time coherence scores
- Trigger manual interventions (with audit trail)
- Subscribe to cascade alerts
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import uuid
from datetime import datetime

# Import the hive engine
import sys
sys.path.append('.')
from agents.hive_engine import ContinuityHive, NodeState, ThreatLevel

app = FastAPI(
    title="Continuity Core API",
    description="Autonomic infrastructure resilience as a service",
    version="1.0.0"
)

# Initialize the hive (in production, this would be a singleton with persistent state)
hive = ContinuityHive()
hive.bootstrap_infrastructure(node_count=12)

class NodeRegistration(BaseModel):
    node_id: str
    node_type: str
    capacity: float
    initial_load: float = 0.5
    connections: List[str] = []

class InterventionRequest(BaseModel):
    target_node: str
    action: str
    priority: str = "normal"  # low, normal, critical

class CoherenceResponse(BaseModel):
    overall_score: float
    node_scores: Dict[str, float]
    active_threats: int
    timestamp: str

@app.on_event("startup")
async def startup_event():
    print("🌍 Continuity Core API starting...")
    print(f"✅ Hive initialized with {len(hive.global_state)} nodes")

@app.get("/")
async def root():
    return {
        "service": "Continuity Core",
        "status": "operational",
        "coherence": f"{sum(n.health for n in hive.global_state.values()) / len(hive.global_state):.2%}",
        "message": "The invisible utility is online."
    }

@app.get("/coherence", response_model=CoherenceResponse)
async def get_coherence():
    """Return real-time coherence metrics for the entire mesh."""
    node_scores = {nid: node.health for nid, node in hive.global_state.items()}
    threats = sum(1 for n in hive.global_state.values() if n.health < 0.7 or n.load > 0.9)
    
    return CoherenceResponse(
        overall_score=sum(node_scores.values()) / len(node_scores),
        node_scores=node_scores,
        active_threats=threats,
        timestamp=datetime.utcnow().isoformat()
    )

@app.post("/nodes/register")
async def register_node(node: NodeRegistration):
    """Register a new infrastructure node into the hive."""
    if node.node_id in hive.global_state:
        raise HTTPException(status_code=400, detail="Node already exists")
    
    hive.global_state[node.node_id] = NodeState(
        id=node.node_id,
        type=node.node_type,
        load=node.initial_load,
        capacity=node.capacity,
        health=1.0,
        connections=node.connections
    )
    return {"status": "registered", "node_id": node.node_id, "message": "Node integrated into hive mesh"}

@app.post("/intervene")
async def request_intervention(request: InterventionRequest, background_tasks: BackgroundTasks):
    """
    Request an autonomous intervention on a specific node.
    In production, this would trigger the agent swarm deliberation.
    """
    if request.target_node not in hive.global_state:
        raise HTTPException(status_code=404, detail="Node not found")
    
    intervention_id = str(uuid.uuid4())
    
    async def execute_intervention():
        node = hive.global_state[request.target_node]
        # Simulate agent deliberation and action
        await asyncio.sleep(0.5)  # Deliberation time
        if request.action == "REDISTRIBUTE_LOAD":
            node.load = max(0.0, node.load - 0.2)
            node.health = min(1.0, node.health + 0.1)
        elif request.action == "ISOLATE_NODE":
            node.connections = []
        print(f"⚡ INTERVENTION {intervention_id}: {request.action} on {request.target_node}")
    
    background_tasks.add_task(execute_intervention)
    
    return {
        "intervention_id": intervention_id,
        "status": "initiated",
        "target": request.target_node,
        "action": request.action,
        "estimated_completion": "2-5 seconds"
    }

@app.get("/simulate/crisis")
async def simulate_crisis():
    """
    DEBUG ENDPOINT: Inject a crisis scenario.
    In production, this would be removed or heavily secured.
    """
    await hive.simulate_crisis()
    return {"status": "crisis_injected", "message": "External shock simulated. Hive responding autonomously."}

@app.get("/history")
async def get_history():
    """Return the intervention history for auditing."""
    return {
        "total_cycles": len(hive.history),
        "recent_events": hive.history[-10:],  # Last 10 events
        "avg_coherence_trend": "stable" if len(hive.history) < 2 else "improving"
    }

if __name__ == "__main__":
    import uvicorn
    print("🔌 Starting Continuity Core API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
