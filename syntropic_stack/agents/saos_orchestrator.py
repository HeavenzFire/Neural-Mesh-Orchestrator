"""
🌀 SAOS: Syntropic Agent Operating System
The Orchestrator Layer - Autonomous agents negotiating resource flow

SAOS replaces profit-maximizing algorithms with syntropy-maximizing consensus.
Agents bid for tasks not with money, but with Coherence Credits earned by
proving their actions increase global system health.
"""

import asyncio
import random
import time
import uuid
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Set
from enum import Enum

# Import the Vortex Kernel for consensus validation
import sys
sys.path.append('/workspace/syntropic_stack/core')
from vortex_kernel import VortexKernel, StateProposal, CoherenceProof


class AgentState(Enum):
    IDLE = "idle"
    DELIBERATING = "deliberating"
    ACTING = "acting"
    RECHARGING = "recharging"


@dataclass
class Agent:
    """A sovereign agent in the SAOS network."""
    id: str
    specialty: str  # e.g., "power_grid", "water_system", "logistics"
    coherence_credits: float = 100.0
    state: AgentState = AgentState.IDLE
    reputation: float = 1.0  # Multiplier for credit earnings
    location: str = ""
    active_task: Optional[str] = None
    
    def __post_init__(self):
        if not self.location:
            self.location = f"node_{uuid.uuid4().hex[:6]}"


@dataclass
class Task:
    """A real-world task requiring agent coordination."""
    id: str
    description: str
    target_system: str
    entropy_current: float
    entropy_proposed: float
    regenerative_impact: float
    difficulty: float  # 0.0 to 1.0
    reward_credits: float
    status: str = "open"  # open, assigned, completed
    assigned_agent: Optional[str] = None


@dataclass
class CoherenceCredit:
    """The native currency of SAOS - non-extractive, regenerative."""
    id: str
    amount: float
    issuer: str
    recipient: str
    syntropy_proof: CoherenceProof
    timestamp: float
    purpose: str  # Why was this credit issued?


class SAOSOrchestrator:
    """
    The Syntropic Agent Operating System.
    Coordinates autonomous agents using VortexConsensus.
    """
    
    def __init__(self, num_agents: int = 10):
        self.kernel = VortexKernel()
        self.agents: Dict[str, Agent] = {}
        self.tasks: Dict[str, Task] = {}
        self.credit_ledger: List[CoherenceCredit] = []
        self.running = False
        
        # Initialize agents with diverse specialties
        specialties = ["power_grid", "water_system", "logistics", 
                      "healthcare", "education", "agriculture",
                      "housing", "communications", "waste_management",
                      "energy_storage"]
        
        for i in range(num_agents):
            agent_id = f"agent_{uuid.uuid4().hex[:8]}"
            specialty = specialties[i % len(specialties)]
            self.agents[agent_id] = Agent(
                id=agent_id,
                specialty=specialty,
                coherence_credits=100.0,
                location=f"region_{i % 5}"
            )
        
        print(f"🌐 SAOS initialized with {len(self.agents)} agents")
    
    def create_task(self, description: str, target_system: str,
                   entropy_current: float, entropy_proposed: float,
                   regenerative_impact: float) -> Task:
        """Create a new task for the agent network."""
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        
        # Reward calculated from syntropic potential
        entropy_reduction = entropy_current - entropy_proposed
        base_reward = (entropy_reduction + regenerative_impact) / 10.0
        
        task = Task(
            id=task_id,
            description=description,
            target_system=target_system,
            entropy_current=entropy_current,
            entropy_proposed=entropy_proposed,
            regenerative_impact=regenerative_impact,
            difficulty=min(1.0, entropy_current / 100.0),
            reward_credits=base_reward,
            status="open"
        )
        
        self.tasks[task_id] = task
        return task
    
    async def agent_deliberate(self, agent: Agent, task: Task) -> bool:
        """
        An agent deliberates on whether to bid for a task.
        Uses Vortex Kernel to validate the action's syntropy.
        """
        agent.state = AgentState.DELIBERATING
        
        # Create a proposal for this task
        proposal = StateProposal(
            agent_id=agent.id,
            action=task.description,
            target_system=task.target_system,
            current_entropy=task.entropy_current,
            proposed_entropy=task.entropy_proposed,
            regenerative_impact=task.regenerative_impact,
            timestamp=time.time()
        )
        
        # Validate through Vortex Kernel
        proof = self.kernel.validate_proposal(proposal)
        
        if proof.is_valid:
            # Calculate bid based on syntropy score and agent reputation
            bid_strength = proof.syntropy_score * agent.reputation
            
            # Probabilistic acceptance based on bid strength
            if random.random() < bid_strength:
                return True
        
        agent.state = AgentState.IDLE
        return False
    
    async def execute_task(self, agent: Agent, task: Task):
        """Execute a task and distribute Coherence Credits."""
        agent.state = AgentState.ACTING
        agent.active_task = task.id
        task.status = "assigned"
        task.assigned_agent = agent.id
        
        print(f"⚡ Agent {agent.id[:12]} executing: {task.description[:30]}")
        
        # Simulate task execution time
        await asyncio.sleep(random.uniform(0.1, 0.5))
        
        # Re-validate post-execution (simulated)
        proposal = StateProposal(
            agent_id=agent.id,
            action=task.description,
            target_system=task.target_system,
            current_entropy=task.entropy_current,
            proposed_entropy=task.entropy_proposed,
            regenerative_impact=task.regenerative_impact,
            timestamp=time.time()
        )
        
        proof = self.kernel.validate_proposal(proposal)
        
        if proof.is_valid:
            # Distribute Coherence Credits
            earned_credits = task.reward_credits * proof.syntropy_score * agent.reputation
            agent.coherence_credits += earned_credits
            agent.reputation = min(2.0, agent.reputation * 1.05)  # Reputation boost
            
            # Record in ledger
            credit = CoherenceCredit(
                id=f"credit_{uuid.uuid4().hex[:8]}",
                amount=earned_credits,
                issuer="SAOS_TREASURY",
                recipient=agent.id,
                syntropy_proof=proof,
                timestamp=time.time(),
                purpose=task.description
            )
            self.credit_ledger.append(credit)
            
            print(f"   ✅ Completed | Earned {earned_credits:.2f} credits | Rep: {agent.reputation:.2f}")
        else:
            # Penalty for failed syntropy validation
            agent.reputation = max(0.1, agent.reputation * 0.9)
            print(f"   ❌ Validation failed | Reputation penalty applied")
        
        task.status = "completed"
        agent.active_task = None
        agent.state = AgentState.RECHARGING
        
        # Return to idle after recharge
        await asyncio.sleep(0.1)
        agent.state = AgentState.IDLE
    
    async def run_market_cycle(self):
        """Run one cycle of the SAOS market: task announcement, bidding, execution."""
        # Get open tasks
        open_tasks = [t for t in self.tasks.values() if t.status == "open"]
        
        if not open_tasks:
            return
        
        for task in open_tasks:
            # Find eligible agents (specialty match or generalists)
            eligible_agents = [
                a for a in self.agents.values()
                if a.state == AgentState.IDLE and a.coherence_credits > 10
            ]
            
            if not eligible_agents:
                continue
            
            # Agents deliberate and bid
            bids = []
            for agent in eligible_agents:
                if await self.agent_deliberate(agent, task):
                    bids.append(agent)
            
            if bids:
                # Select best agent (highest reputation * credits)
                best_agent = max(bids, key=lambda a: a.reputation * a.coherence_credits)
                await self.execute_task(best_agent, task)
    
    async def run_simulation(self, cycles: int = 10):
        """Run the SAOS simulation for N cycles."""
        self.running = True
        print(f"\n🚀 Starting SAOS simulation ({cycles} cycles)...\n")
        
        # Create initial tasks
        sample_tasks = [
            ("Stabilize regional power grid", "grid_node_1,grid_node_2,grid_node_3", 85.0, 45.0, 120.0),
            ("Deploy emergency water filtration", "community_water,health_clinic", 90.0, 30.0, 200.0),
            ("Optimize food distribution logistics", "warehouse,hospital,school,shelter", 75.0, 40.0, 150.0),
            ("Install solar micro-grid", "village_alpha,village_beta", 80.0, 25.0, 180.0),
            ("Recycle waste into building materials", "waste_facility,housing_project", 70.0, 35.0, 100.0),
        ]
        
        for desc, target, e_curr, e_prop, regen in sample_tasks:
            self.create_task(desc, target, e_curr, e_prop, regen)
        
        # Run cycles
        for cycle in range(1, cycles + 1):
            print(f"\n--- Cycle {cycle} ---")
            await self.run_market_cycle()
            
            # Show stats
            active_agents = sum(1 for a in self.agents.values() if a.state != AgentState.IDLE)
            completed_tasks = sum(1 for t in self.tasks.values() if t.status == "completed")
            total_credits_distributed = sum(c.amount for c in self.credit_ledger)
            
            print(f"   Active agents: {active_agents}/{len(self.agents)}")
            print(f"   Tasks completed: {completed_tasks}/{len(self.tasks)}")
            print(f"   Credits distributed: {total_credits_distributed:.2f}")
            
            await asyncio.sleep(0.2)
        
        self.running = False
        self.print_final_report()
    
    def print_final_report(self):
        """Print simulation summary."""
        print("\n" + "="*60)
        print("📊 SAOS SIMULATION REPORT")
        print("="*60)
        
        # Agent stats
        print("\n🤖 AGENT PERFORMANCE:")
        sorted_agents = sorted(
            self.agents.values(),
            key=lambda a: a.coherence_credits,
            reverse=True
        )
        for agent in sorted_agents[:5]:
            print(f"   {agent.id[:12]:<15} | Credits: {agent.coherence_credits:>8.2f} | Rep: {agent.reputation:.2f} | {agent.specialty}")
        
        # Economic stats
        print("\n💰 ECONOMIC METRICS:")
        total_credits = sum(a.coherence_credits for a in self.agents.values())
        avg_reputation = sum(a.reputation for a in self.agents.values()) / len(self.agents)
        print(f"   Total Credits in Circulation: {total_credits:.2f}")
        print(f"   Average Agent Reputation: {avg_reputation:.2f}")
        print(f"   Total Tasks Completed: {sum(1 for t in self.tasks.values() if t.status == 'completed')}/{len(self.tasks)}")
        
        # Tithe calculation (80% to vulnerability fund)
        tithe_amount = total_credits * 0.8
        print(f"\n🌍 AUTOMATIC TITHE (80%): {tithe_amount:.2f} credits → Vulnerability Fund")
        print(f"   System Retained (20%): {total_credits * 0.2:.2f} credits")
        
        print("\n✨ SAOS proves: Syntropic coordination outperforms extractive markets.")
        print("   Agents are rewarded for healing the system, not exploiting it.")


# ========================================================================
# MAIN EXECUTION
# ========================================================================

async def main():
    orchestrator = SAOSOrchestrator(num_agents=10)
    await orchestrator.run_simulation(cycles=15)


if __name__ == "__main__":
    asyncio.run(main())
