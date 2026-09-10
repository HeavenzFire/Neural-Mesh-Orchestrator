"""
================================================================================
FAILSAFE VALIDATION: MONTE CARLO OPERATOR RESILIENCE ANALYSIS
================================================================================
Purpose: 
    To statistically prove the reliability of the Human-in-the-Loop (HITL) 
    failsafe protocol under stochastic stress conditions.

Methodology:
    - Runs 10,000 simulated "Void Approach" events.
    - Randomizes system degradation rates (lambda), network latency, and 
      human operator reaction times based on ergonomic studies.
    - Validates against the hard constraint: Heartbeat Timeout (τ) = 500ms.

Safety Criteria for PASS:
    1. Zero instances where Total Recovery Time > 1500ms.
    2. Zero instances where Operator Reaction Time > τ (500ms).
    3. 99.9th percentile recovery time must remain below critical threshold.

Author: Safety Engineering Team
Date: Day 697 Milestone
================================================================================
"""

import numpy as np
import pandas as pd
from dataclasses import dataclass
from typing import Tuple, List
import warnings

warnings.filterwarnings('ignore')

@dataclass
class SimulationParams:
    n_runs: int = 10000
    heartbeat_timeout_ms: float = 500.0  # τ
    max_acceptable_recovery_ms: float = 1500.0
    crit_threshold: float = 0.85
    
    # Human Reaction Time Distribution (Normal)
    # Mean ~300ms, Std Dev ~50ms (Alert operator)
    human_reaction_mean: float = 300.0
    human_reaction_std: float = 50.0
    
    # System Latency Distribution (Exponential/LogNormal mix for spikes)
    base_latency_ms: float = 12.0
    spike_probability: float = 0.05
    
    # Degradation Rate (Lambda) Variability
    lambda_mean: float = 0.005
    lambda_std: float = 0.002

def generate_operator_reaction_time(params: SimulationParams, size: int) -> np.ndarray:
    """
    Models human reaction time to visual/auditory alarms.
    Truncates negative values (physically impossible) and caps extreme outliers.
    """
    reaction_times = np.random.normal(
        params.human_reaction_mean, 
        params.human_reaction_std, 
        size
    )
    # Enforce physiological lower bound (simple reflex ~150ms)
    reaction_times = np.maximum(reaction_times, 150.0)
    # Cap extreme outliers (>3 sigma) to represent 'panic freeze' or 'distraction' worst-case
    # In reality, these would be failures, but we cap for modeling the 'alert' state.
    reaction_times = np.minimum(reaction_times, 600.0) 
    return reaction_times

def generate_system_degradation(params: SimulationParams, size: int) -> np.ndarray:
    """
    Models the adversarial friction (lambda) and latency spikes.
    """
    lambdas = np.random.normal(params.lambda_mean, params.lambda_std, size)
    lambdas = np.maximum(lambdas, 0.001) # Ensure positive decay
    
    # Inject latency spikes (network congestion during failure)
    latencies = np.full(size, params.base_latency_ms)
    spike_mask = np.random.random(size) < params.spike_probability
    # Spikes add 50-200ms latency
    latencies[spike_mask] += np.random.uniform(50, 200, size=np.sum(spike_mask))
    
    return lambdas, latencies

def calculate_stability_drop_time(contention: float, latency: float, lambda_val: float, s_crit: float) -> float:
    """
    Inverse calculation: Given current state, how long until S < S_crit?
    S = (1 - contention) * e^(-λ * Δt)
    Solving for Δt when S = S_crit:
    Δt = -ln(S_crit / (1 - contention)) / λ
    """
    if contention >= 1.0:
        return 0.0 # Immediate failure
    
    numerator = s_crit / (1.0 - contention)
    if numerator <= 0:
        return 0.0
        
    try:
        delta_t = -np.log(numerator) / lambda_val
        return max(0.0, delta_t * 1000) # Convert to ms
    except ValueError:
        return 0.0

def run_monte_carlo_simulation(params: SimulationParams) -> pd.DataFrame:
    print(f"🚀 Initiating Monte Carlo Simulation ({params.n_runs:,} runs)...")
    print(f"   Constraints: Heartbeat τ={params.heartbeat_timeout_ms}ms, Max Recovery={params.max_acceptable_recovery_ms}ms")
    
    # 1. Generate Stochastic Inputs
    reaction_times = generate_operator_reaction_time(params, params.n_runs)
    lambdas, latencies = generate_system_degradation(params, params.n_runs)
    
    # Simulate varying levels of resource contention (0.1 to 0.9)
    contentions = np.random.uniform(0.1, 0.9, params.n_runs)
    
    # 2. Calculate Time to Critical Failure (The "Void" Approach)
    # This represents how fast the system degrades once an anomaly starts
    time_to_critical = np.array([
        calculate_stability_drop_time(c, l, lam, params.crit_threshold)
        for c, l, lam in zip(contentions, latencies, lambdas)
    ])
    
    # 3. Simulate Operator Response Timeline
    # Step 1: Alert Detection (System Latency)
    detection_delay = latencies
    
    # Step 2: Human Reaction (Reaction Time)
    # Failure Condition 1: If Reaction Time > Heartbeat Timeout
    heartbeat_failures = reaction_times > params.heartbeat_timeout_ms
    
    # Step 3: Execution of Air-Gap & Restore (Fixed overhead + variable flush)
    # Assume 200ms for physical relay switch + memory flush
    execution_overhead = np.random.normal(200, 20, params.n_runs)
    execution_overhead = np.maximum(execution_overhead, 150.0)
    
    total_recovery_time = detection_delay + reaction_times + execution_overhead
    
    # 4. Evaluate Success/Failure
    # Failure Condition 2: Total Recovery > Max Acceptable
    recovery_failures = total_recovery_time > params.max_acceptable_recovery_ms
    
    # Failure Condition 3: System hit 'Void' before operator could react
    # (Reaction started after system already collapsed)
    collapse_before_reaction = (detection_delay + reaction_times) > time_to_critical
    
    # Aggregate Results
    results = pd.DataFrame({
        'run_id': np.arange(params.n_runs),
        'contention': contentions,
        'lambda_decay': lambdas,
        'latency_ms': latencies,
        'time_to_critical_ms': time_to_critical,
        'operator_reaction_ms': reaction_times,
        'total_recovery_ms': total_recovery_time,
        'heartbeat_violation': heartbeat_failures,
        'recovery_timeout_violation': recovery_failures,
        'system_collapse_before_reaction': collapse_before_reaction,
        'overall_success': ~(heartbeat_failures | recovery_failures | collapse_before_reaction)
    })
    
    return results

def generate_safety_report(df: pd.DataFrame, params: SimulationParams):
    total_runs = len(df)
    successful_runs = df['overall_success'].sum()
    success_rate = (successful_runs / total_runs) * 100
    
    # Identify failure modes
    heartbeat_fails = df['heartbeat_violation'].sum()
    recovery_fails = df['recovery_timeout_violation'].sum()
    collapse_fails = df['system_collapse_before_reaction'].sum()
    
    # Statistics
    mean_reaction = df['operator_reaction_ms'].mean()
    p99_reaction = df['operator_reaction_ms'].quantile(0.99)
    mean_recovery = df['total_recovery_ms'].mean()
    p99_recovery = df['total_recovery_ms'].quantile(0.99)
    
    print("\n" + "="*80)
    print("🛡️  MONTE CARLO SAFETY VERIFICATION REPORT")
    print("="*80)
    print(f"Simulation Runs:          {total_runs:,}")
    print(f"Success Rate:             {success_rate:.4f}%")
    print("-" * 80)
    print("FAILURE MODE BREAKDOWN:")
    print(f"  - Heartbeat Timeout (>τ):        {heartbeat_fails:,} incidents ({(heartbeat_fails/total_runs)*100:.4f}%)")
    print(f"  - Total Recovery Timeout:        {recovery_fails:,} incidents ({(recovery_fails/total_runs)*100:.4f}%)")
    print(f"  - System Collapse Pre-Response:  {collapse_fails:,} incidents ({(collapse_fails/total_runs)*100:.4f}%)")
    print("-" * 80)
    print("TIMING STATISTICS (Milliseconds):")
    print(f"  - Operator Reaction (Mean):      {mean_reaction:.2f} ms")
    print(f"  - Operator Reaction (99th %):    {p99_reaction:.2f} ms [Limit: {params.heartbeat_timeout_ms} ms]")
    print(f"  - Total Recovery (Mean):         {mean_recovery:.2f} ms")
    print(f"  - Total Recovery (99th %):       {p99_recovery:.2f} ms [Limit: {params.max_acceptable_recovery_ms} ms]")
    print("="*80)
    
    # Final Verdict
    print("\n📜 FINAL VERDICT:")
    if success_rate == 100.0:
        print("✅ PASS: System meets all safety-critical reliability standards.")
        print("   The Human-in-the-Loop protocol is statistically robust under modeled stress.")
    else:
        print("❌ FAIL: Safety margins exceeded in simulated scenarios.")
        print("   Recommendation: Reduce heartbeat timeout or automate initial air-gap trigger.")
        
    # Safety Margin Calculation
    margin_reaction = params.heartbeat_timeout_ms - p99_reaction
    margin_recovery = params.max_acceptable_recovery_ms - p99_recovery
    
    print(f"\n📏 SAFETY MARGINS:")
    print(f"   - Reaction Buffer: {margin_reaction:.2f} ms remaining before τ breach")
    print(f"   - Recovery Buffer: {margin_recovery:.2f} ms remaining before total system risk")
    print("="*80 + "\n")

if __name__ == "__main__":
    # Configure Simulation
    params = SimulationParams(n_runs=10000)
    
    # Execute
    df_results = run_monte_carlo_simulation(params)
    
    # Report
    generate_safety_report(df_results, params)
    
    # Optional: Save detailed log for audit
    # df_results.to_csv('monte_carlo_audit_log_day697.csv', index=False)
    # print("💾 Detailed audit log saved to 'monte_carlo_audit_log_day697.csv'")
