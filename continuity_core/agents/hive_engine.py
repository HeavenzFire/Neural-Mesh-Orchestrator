"""
Continuity Core: The Global Nervous System
------------------------------------------
A utility that detects, predicts, and autonomously resolves infrastructure 
disruptions before they cascade into systemic failures.

The world doesn't know it needs this until the moment a predicted blackout 
is silently averted, or a supply chain bottleneck dissolves itself before 
a single truck stops moving.
"""

import asyncio
import random
import time
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum

class ThreatLevel(Enum):
    STABLE = "stable"
    FLUCTUATING = "fluctuating"
    CRITICAL = "critical"
    CASCADE_IMMINENT = "cascade_imminent"

@dataclass
class NodeState:
    id: str
    type: str  # power_grid, logistics_hub, data_center, water_system
    load: float  # 0.0 to 1.0
    capacity: float
    health: float  # 0.0 to 1.0
    connections: List[str] = field(default_factory=list)
    stress_vector: List[float] = field(default_factory=lambda: [0.0]*5)

@dataclass
class Intervention:
    id: str
    source_agent: str
    target_node: str
    action: str
    predicted_outcome: str
    confidence: float

class CoherenceAgent:
    """
    An autonomous agent within the hive that monitors a specific sector
    and negotiates resource balancing with neighbors to prevent interference.
    """
    def __init__(self, agent_id: str, sector: str):
        self.agent_id = agent_id
        self.sector = sector
        self.knowledge_base: Dict[str, Any] = {}
        self.active_interventions: List[Intervention] = []

    async def perceive(self, global_state: Dict[str, NodeState]) -> Dict[str, float]:
        """Scan the local sector for coherence anomalies."""
        anomaly_score = 0.0
        for node_id, state in global_state.items():
            if state.health < 0.7 or state.load > 0.9:
                anomaly_score += (1.0 - state.health) * state.load
        return {"anomaly_score": anomaly_score, "timestamp": time.time()}

    async def deliberate(self, perception: Dict[str, float], global_state: Dict[str, NodeState]) -> Optional[Intervention]:
        """Determine the optimal action to restore coherence."""
        if perception["anomaly_score"] > 0.5:
            # Find the most stressed node in our sector
            target = None
            max_stress = 0
            for nid, state in global_state.items():
                stress = (state.load / state.capacity) * (1.0 - state.health)
                if stress > max_stress:
                    max_stress = stress
                    target = nid
            
            if target:
                return Intervention(
                    id=f"int_{random.randint(1000,9999)}",
                    source_agent=self.agent_id,
                    target_node=target,
                    action="REDISTRIBUTE_LOAD",
                    predicted_outcome="Stabilize node load by 15% via neighbor handoff",
                    confidence=0.85 + (random.random() * 0.1)
                )
        return None

    async def act(self, intervention: Intervention, global_state: Dict[str, NodeState]) -> bool:
        """Execute the intervention on the physical/digital twin layer."""
        if intervention.target_node in global_state:
            node = global_state[intervention.target_node]
            # Simulate effect
            node.load = max(0.0, node.load - 0.15)
            node.health = min(1.0, node.health + 0.05)
            print(f"[AGENT {self.agent_id}] INTERVENTION: {intervention.action} on {intervention.target_node}. New Load: {node.load:.2f}")
            return True
        return False

class ContinuityHive:
    """
    The central organism. It orchestrates agents to maintain global coherence
    across critical infrastructure layers.
    """
    def __init__(self):
        self.agents: List[CoherenceAgent] = []
        self.global_state: Dict[str, NodeState] = {}
        self.history: List[Dict[str, Any]] = []
        
    def bootstrap_infrastructure(self, node_count: int = 10):
        """Initialize the digital twin of the critical infrastructure."""
        types = ["power_grid", "logistics_hub", "data_center", "water_system"]
        for i in range(node_count):
            nid = f"node_{i}"
            self.global_state[nid] = NodeState(
                id=nid,
                type=random.choice(types),
                load=random.uniform(0.3, 0.8),
                capacity=100.0,
                health=random.uniform(0.8, 1.0),
                connections=[]
            )
        # Create random mesh connections
        keys = list(self.global_state.keys())
        for k in keys:
            self.global_state[k].connections = random.sample([x for x in keys if x != k], k=min(3, len(keys)-1))
            
        # Spawn agents
        for i in range(4):
            self.agents.append(CoherenceAgent(f"agent_{i}", f"sector_{i}"))

    async def run_cycle(self):
        """One pulse of the hive mind."""
        perceptions = await asyncio.gather(*[a.perceive(self.global_state) for a in self.agents])
        
        interventions = []
        for i, agent in enumerate(self.agents):
            plan = await agent.deliberate(perceptions[i], self.global_state)
            if plan:
                interventions.append((agent, plan))
        
        # Execute interventions concurrently
        if interventions:
            await asyncio.gather(*[a.act(i, self.global_state) for a, i in interventions])
            
        # Log state
        avg_health = sum(n.health for n in self.global_state.values()) / len(self.global_state)
        self.history.append({"time": time.time(), "avg_health": avg_health, "interventions": len(interventions)})
        return avg_health

    async def simulate_crisis(self):
        """Inject a shock to test resilience."""
        print("\n⚠️  SIMULATING EXTERNAL SHOCK: Grid Surge + Supply Chain Blockage")
        for nid, node in list(self.global_state.items())[:3]:
            node.load = 0.95
            node.health = 0.4
            print(f"   -> {nid} CRITICAL FAILURE IMMINENT")

async def main():
    print("🌍 INITIALIZING CONTINUITY CORE...")
    hive = ContinuityHive()
    hive.bootstrap_infrastructure(node_count=8)
    
    print(f"✅ Monitoring {len(hive.global_state)} Critical Nodes with {len(hive.agents)} Coherence Agents.")
    print("🔄 Starting Autonomic Loop...\n")
    
    # Run stable cycles
    for i in range(5):
        health = await hive.run_cycle()
        print(f"Pulse {i+1}: System Coherence at {health:.2%}")
        await asyncio.sleep(0.5)
    
    # Inject Crisis
    await hive.simulate_crisis()
    
    # Run recovery cycles
    print("\n🛡️  ACTIVATING DEFENSIVE COHERENCE PROTOCOLS...")
    for i in range(10):
        health = await hive.run_cycle()
        print(f"Recovery Pulse {i+1}: System Coherence at {health:.2%}")
        if health > 0.85:
            print("✨ SYSTEM STABILIZED. CATASTROPHE AVERTED.")
            break
        await asyncio.sleep(0.5)

if __name__ == "__main__":
    asyncio.run(main())
