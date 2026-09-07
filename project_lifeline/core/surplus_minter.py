"""
Surplus Minter for Project LIFELINE (Production Grade)

Generates LIFE tokens based on verified regenerative actions:
- Grid stability improvements
- Water purification metrics  
- Data healing operations
- Infrastructure resilience scores

This creates currency from positive utility, not computational waste.
"""

import time
import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, List

class SurplusMinter:
    def __init__(self):
        self.total_minted = 0
        self.minting_events = []
        self.regenerative_sources = {
            "grid_stability": {"capacity": 2_100_000_000, "rate": 0.50},  # $2.1B/year, 50% allocation
            "water_purification": {"capacity": 800_000_000, "rate": 0.20},  # $0.8B/year, 20% allocation
            "data_healing": {"capacity": 1_300_000_000, "rate": 0.30},  # $1.3B/year, 30% allocation
        }
        
    def verify_regenerative_action(self, action_type: str, metric_value: float) -> bool:
        """
        Verify that a regenerative action actually occurred.
        In production, this would interface with real IoT sensors and audit systems.
        """
        if action_type not in self.regenerative_sources:
            return False
            
        # Simulate verification thresholds
        thresholds = {
            "grid_stability": 0.95,  # 95% uptime improvement
            "water_purification": 0.99,  # 99% contaminant removal
            "data_healing": 0.98,  # 98% error correction
        }
        
        return metric_value >= thresholds.get(action_type, 0.9)
    
    def mint_tokens(self, action_type: str, metric_value: float, verifier_id: str) -> Dict:
        """
        Mint LIFE tokens based on verified regenerative actions.
        """
        if not self.verify_regenerative_action(action_type, metric_value):
            return {"success": False, "error": "Verification failed"}
            
        # Calculate token amount based on impact
        base_capacity = self.regenerative_sources[action_type]["capacity"]
        impact_ratio = metric_value / 1.0  # Normalize to max impact
        
        # Mint proportional to real-world value created
        tokens_minted = int(base_capacity * impact_ratio / 365 / 24)  # Per hour
        
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action_type": action_type,
            "metric_value": metric_value,
            "verifier_id": verifier_id,
            "tokens_minted": tokens_minted,
            "tx_hash": hashlib.sha256(f"{time.time()}{action_type}{metric_value}".encode()).hexdigest()[:16]
        }
        
        self.minting_events.append(event)
        self.total_minted += tokens_minted
        
        return {
            "success": True,
            "tokens_minted": tokens_minted,
            "total_supply": self.total_minted,
            "tx_hash": event["tx_hash"]
        }
    
    def get_minting_stats(self) -> Dict:
        """Return current minting statistics."""
        return {
            "total_minted": self.total_minted,
            "events_count": len(self.minting_events),
            "sources": self.regenerative_sources,
            "last_24h_events": [e for e in self.minting_events[-24:]]
        }

def run_simulation():
    """Run a demonstration of the surplus minter."""
    print("🎗️  Project LIFELINE - Surplus Minter Active")
    print("=" * 50)
    
    minter = SurplusMinter()
    
    # Simulate regenerative actions from various sources
    simulations = [
        ("grid_stability", 0.97, "GRID_NODE_001"),
        ("water_purification", 0.995, "WATER_SYS_042"),
        ("data_healing", 0.985, "DATA_SWARM_007"),
        ("grid_stability", 0.96, "GRID_NODE_003"),
        ("water_purification", 0.992, "WATER_SYS_018"),
    ]
    
    total_generated = 0
    
    for action_type, metric, verifier in simulations:
        result = minter.mint_tokens(action_type, metric, verifier)
        if result["success"]:
            generated = result["tokens_minted"]
            total_generated += generated
            print(f"✅ Verified: {action_type.replace('_', ' ').title()}")
            print(f"   Metric: {metric*100:.1f}% efficiency")
            print(f"   Generated: ${generated:,} LIFE tokens")
            print(f"   TX: {result['tx_hash']}")
            print()
    
    stats = minter.get_minting_stats()
    print("=" * 50)
    print(f"📊 Session Summary:")
    print(f"   Total Generated: ${total_generated:,}")
    print(f"   Annual Projection: ${total_generated * 24 * 365:,}")
    print(f"   Target Coverage: $4.2B/year")
    print(f"   Status: {'SURPLUS ACHIEVED' if total_generated * 24 * 365 >= 4_200_000_000 else 'SCALING...'}")
    
    return minter

if __name__ == "__main__":
    run_simulation()
