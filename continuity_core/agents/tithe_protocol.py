"""
The Tithe Protocol: Autonomous Fund Distribution Engine

This module implements the economic logic for Continuity Core,
automatically splitting revenue between operational costs (20%)
and the Vulnerability Fund (80%).
"""

from dataclasses import dataclass
from typing import List, Dict
from datetime import datetime

@dataclass
class RevenueEvent:
    source: str  # e.g., "Municipal Contract - Tokyo", "Reinsurer Premium - SwissRe"
    amount_usd: float
    timestamp: datetime

@dataclass
class Distribution:
    recipient: str
    amount_usd: float
    category: str  # "Operations", "Disaster Relief", "Community Resilience", "Open Source Defense"
    timestamp: datetime

class TitheEngine:
    """
    Manages the 80/20 split of all incoming revenue.
    """
    
    OPERATIONAL_SHARE = 0.20
    VULNERABILITY_SHARE = 0.80
    
    def __init__(self):
        self.ledger: List[Distribution] = []
        self.total_revenue = 0.0
        self.total_distributed = 0.0
        
    def process_revenue(self, event: RevenueEvent) -> List[Distribution]:
        """
        Ingest a revenue event and automatically split funds.
        """
        distributions = []
        
        # Calculate splits
        ops_amount = event.amount_usd * self.OPERATIONAL_SHARE
        vuln_amount = event.amount_usd * self.VULNERABILITY_SHARE
        
        # Record Operational Split
        ops_dist = Distribution(
            recipient="Continuity Core Operations",
            amount_usd=ops_amount,
            category="Operations",
            timestamp=datetime.now()
        )
        distributions.append(ops_dist)
        
        # Record Vulnerability Split (Placeholder for smart contract logic)
        # In production, this triggers a blockchain transaction or API call to relief orgs
        vuln_dist = Distribution(
            recipient="Vulnerability Fund Pool",
            amount_usd=vuln_amount,
            category="Vulnerability Fund",
            timestamp=datetime.now()
        )
        distributions.append(vuln_dist)
        
        # Update ledger
        self.ledger.extend(distributions)
        self.total_revenue += event.amount_usd
        self.total_distributed += (ops_amount + vuln_amount)
        
        return distributions
    
    def allocate_vulnerability_funds(self, 
                                     disaster_relief_pct: float = 0.50,
                                     community_resilience_pct: float = 0.30,
                                     open_source_defense_pct: float = 0.20) -> List[Distribution]:
        """
        Sub-allocate the Vulnerability Fund pool to specific causes.
        Default split: 50% Disaster Relief, 30% Community, 20% Open Source.
        """
        allocations = []
        
        # Calculate total available in Vulnerability Fund
        current_vuln_balance = sum(
            d.amount_usd for d in self.ledger if d.category == "Vulnerability Fund"
        )
        
        if current_vuln_balance == 0:
            return allocations
            
        # Create sub-allocations
        categories = [
            ("Disaster Relief", disaster_relief_pct),
            ("Community Resilience", community_resilience_pct),
            ("Open Source Defense", open_source_defense_pct)
        ]
        
        for category, pct in categories:
            amount = current_vuln_balance * pct
            alloc = Distribution(
                recipient=f"{category} Initiative",
                amount_usd=amount,
                category=category,
                timestamp=datetime.now()
            )
            allocations.append(alloc)
            
        return allocations
    
    def generate_transparency_report(self) -> Dict:
        """
        Generate a public-facing report of funds received vs. distributed.
        """
        ops_total = sum(d.amount_usd for d in self.ledger if d.category == "Operations")
        vuln_total = sum(d.amount_usd for d in self.ledger if d.category == "Vulnerability Fund")
        
        return {
            "total_revenue_usd": self.total_revenue,
            "operational_sustainment_usd": ops_total,
            "vulnerability_fund_usd": vuln_total,
            "distribution_ratio": f"{(ops_total/self.total_revenue)*100:.1f}% / {(vuln_total/self.total_revenue)*100:.1f}%",
            "transaction_count": len(self.ledger),
            "timestamp": datetime.now().isoformat()
        }

# --- Demo Execution ---
if __name__ == "__main__":
    engine = TitheEngine()
    
    print("🏛️  Initializing Tithe Protocol...")
    
    # Simulate revenue streams
    events = [
        RevenueEvent("Municipal Contract - Tokyo Grid", 500000.00, datetime.now()),
        RevenueEvent("Reinsurer Premium - Global Shield Co", 1200000.00, datetime.now()),
        RevenueEvent("Enterprise API - Logistics Corp", 75000.00, datetime.now()),
    ]
    
    for event in events:
        dists = engine.process_revenue(event)
        print(f"\n💰 Received: ${event.amount_usd:,.2f} from {event.source}")
        for d in dists:
            print(f"   ➔ ${d.amount_usd:,.2f} to {d.recipient} ({d.category})")
    
    # Show sub-allocation
    print("\n🤲 Allocating Vulnerability Fund...")
    sub_allocs = engine.allocate_vulnerability_funds()
    for alloc in sub_allocs:
        print(f"   ➔ ${alloc.amount_usd:,.2f} to {alloc.recipient}")
    
    # Transparency Report
    print("\n📜 Transparency Report:")
    report = engine.generate_transparency_report()
    for key, value in report.items():
        print(f"   {key}: {value}")
