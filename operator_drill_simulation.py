#!/usr/bin/env python3
"""
Operator Drill Simulation: False-Positive Stability Drop Response Test

This simulation models a false-positive stability drop scenario to validate:
1. Human-in-the-loop response speed under pressure
2. Failsafe override procedure execution time
3. System recovery reliability after unnecessary air-gap trigger

Simulation Parameters:
- Heartbeat timeout τ = 500ms
- Critical stability threshold S_crit = 0.85
- False-positive trigger: Simulated anomaly at t=2.0s
"""

import numpy as np
from dataclasses import dataclass
from enum import Enum
from typing import List, Tuple

class DrillPhase(Enum):
    NORMAL_OPS = "Normal Operations"
    ANOMALY_DETECTED = "Anomaly Detected"
    OPERATOR_ALERTED = "Operator Alerted"
    OPERATOR_RESPONDING = "Operator Responding"
    KILL_SWITCH_DEPRESSED = "Kill-Switch Depressed"
    AIR_GAP_VERIFIED = "Air-Gap Verified"
    MEMORY_FLUSHED = "Memory Flushed"
    CACHE_RESTORED = "Cache Restored"
    SYSTEM_RECOVERED = "System Recovered"

@dataclass
class DrillEvent:
    timestamp_ms: float
    phase: DrillPhase
    stability_value: float
    notes: str

@dataclass
class OperatorResponseMetrics:
    reaction_time_ms: float
    procedure_execution_time_ms: float
    total_response_time_ms: float
    success: bool

def simulate_operator_drill(
    base_latency: float = 12.0,
    contention_ratio: float = 0.10,
    lambda_decay: float = 0.003,
    false_positive_time_ms: float = 2000.0,
    operator_reaction_time_ms: float = 350.0,
    procedure_steps_time_ms: float = 800.0,
    num_samples: int = 500
) -> Tuple[List[float], List[float], List[DrillEvent], OperatorResponseMetrics]:
    """
    Simulate a complete operator drill scenario with false-positive trigger.
    
    Args:
        base_latency: Baseline processing latency in ms
        contention_ratio: Resource contention ratio (0.0 to 1.0)
        lambda_decay: Decay constant λ in ms⁻¹
        false_positive_time_ms: Time at which false anomaly is injected
        operator_reaction_time_ms: Simulated human reaction time
        procedure_steps_time_ms: Time to execute 4-step override procedure
        num_samples: Number of simulation samples
    
    Returns:
        Tuple of (timestamps, stability_values, event_log, response_metrics)
    """
    
    # Time series
    timestamps = np.linspace(0, 5000, num_samples)  # 5 second simulation
    stability_values = np.ones(num_samples)
    events: List[DrillEvent] = []
    
    # Pre-trigger state (normal operations)
    for i, t in enumerate(timestamps):
        if t < false_positive_time_ms:
            # Normal stable operations with minor noise
            latency_jitter = np.random.normal(0, 1.0)
            contention_jitter = np.random.normal(0, 0.01)
            
            S = (1.0 - min(contention_ratio + contention_jitter, 1.0)) * \
                np.exp(-lambda_decay * (base_latency + latency_jitter))
            stability_values[i] = max(0.0, min(1.0, S))
        else:
            # FALSE POSITIVE: Artificially inject anomaly
            # Simulate sensor glitch causing apparent latency spike
            fake_latency = base_latency + 150.0  # Apparent 150ms spike
            S = (1.0 - contention_ratio) * np.exp(-lambda_decay * fake_latency)
            stability_values[i] = max(0.0, S)
    
    # Event logging
    trigger_detected = False
    air_gap_triggered = False
    system_recovered = False
    
    for i, t in enumerate(timestamps):
        # Check for threshold breach
        if not trigger_detected and stability_values[i] < 0.85:
            trigger_detected = True
            events.append(DrillEvent(
                timestamp_ms=t,
                phase=DrillPhase.ANOMALY_DETECTED,
                stability_value=stability_values[i],
                notes=f"Stability dropped to {stability_values[i]:.4f} (< 0.85 threshold)"
            ))
            
            # Operator alert sent immediately
            events.append(DrillEvent(
                timestamp_ms=t,
                phase=DrillPhase.OPERATOR_ALERTED,
                stability_value=stability_values[i],
                notes="Visual/audio alert dispatched to human supervisor"
            ))
        
        # Operator response (after reaction delay)
        elif trigger_detected and not air_gap_triggered and \
             t >= false_positive_time_ms + operator_reaction_time_ms:
            
            events.append(DrillEvent(
                timestamp_ms=t,
                phase=DrillPhase.OPERATOR_RESPONDING,
                stability_value=stability_values[i],
                notes=f"Operator acknowledged alert after {t - false_positive_time_ms:.1f}ms"
            ))
            
            # Step 1: Kill-switch depressed
            kill_switch_time = t + 50  # 50ms to physically depress switch
            events.append(DrillEvent(
                timestamp_ms=kill_switch_time,
                phase=DrillPhase.KILL_SWITCH_DEPRESSED,
                stability_value=stability_values[i],
                notes="Physical E-Stop activated - NIC relays severed"
            ))
            
            # Step 2: Air-gap verification
            airgap_verify_time = kill_switch_time + 150
            events.append(DrillEvent(
                timestamp_ms=airgap_verify_time,
                phase=DrillPhase.AIR_GAP_VERIFIED,
                stability_value=stability_values[i],
                notes="AIR_GAP_STATUS: TRUE confirmed via terminal"
            ))
            
            # Step 3: Memory flush
            flush_time = airgap_verify_time + 200
            events.append(DrillEvent(
                timestamp_ms=flush_time,
                phase=DrillPhase.MEMORY_FLUSHED,
                stability_value=1.0,  # Reset to baseline
                notes="sysctl vm.drop_caches=3 && swarm-genetic --purge-memory executed"
            ))
            
            # Step 4: Cache restoration
            restore_time = flush_time + 400
            events.append(DrillEvent(
                timestamp_ms=restore_time,
                phase=DrillPhase.CACHE_RESTORED,
                stability_value=1.0,
                notes="Phase Lock baseline v1.0.bin deployed successfully"
            ))
            
            air_gap_triggered = True
            
            # Force stability back to safe baseline for remainder
            stability_values[i:] = 1.0
        
        # Mark recovery complete
        if air_gap_triggered and not system_recovered and t >= false_positive_time_ms + operator_reaction_time_ms + procedure_steps_time_ms:
            system_recovered = True
            events.append(DrillEvent(
                timestamp_ms=t,
                phase=DrillPhase.SYSTEM_RECOVERED,
                stability_value=1.0,
                notes="System restored to deterministic baseline - drill complete"
            ))
    
    # Calculate metrics
    total_response_time = operator_reaction_time_ms + procedure_steps_time_ms
    metrics = OperatorResponseMetrics(
        reaction_time_ms=operator_reaction_time_ms,
        procedure_execution_time_ms=procedure_steps_time_ms,
        total_response_time_ms=total_response_time,
        success=system_recovered
    )
    
    return timestamps.tolist(), stability_values.tolist(), events, metrics


def run_drill_analysis():
    """Execute drill simulation and print comprehensive report."""
    
    print("=" * 70)
    print("OPERATOR DRILL SIMULATION: FALSE-POSITIVE STABILITY DROP")
    print("=" * 70)
    print()
    
    # Run simulation with baseline parameters
    timestamps, stability, events, metrics = simulate_operator_drill(
        base_latency=12.0,
        contention_ratio=0.10,
        lambda_decay=0.003,
        false_positive_time_ms=2000.0,
        operator_reaction_time_ms=350.0,  # Average human reaction to visual alert
        procedure_steps_time_ms=800.0,    # Time for 4-step procedure
        num_samples=500
    )
    
    print("SIMULATION PARAMETERS:")
    print(f"  • Base Latency (Δt): 12.0 ms")
    print(f"  • Contention Ratio: 0.10 (10%)")
    print(f"  • Decay Constant (λ): 0.003 ms⁻¹")
    print(f"  • Critical Threshold (S_crit): 0.85")
    print(f"  • False-Positive Injection Time: 2000.0 ms")
    print(f"  • Operator Reaction Time: 350.0 ms")
    print(f"  • Procedure Execution Time: 800.0 ms")
    print()
    
    print("CHRONOLOGICAL EVENT LOG:")
    print("-" * 70)
    for event in events:
        print(f"[{event.timestamp_ms:7.2f} ms] {event.phase.value:25s} | S={event.stability_value:.4f}")
        print(f"              └─ {event.notes}")
    print("-" * 70)
    print()
    
    print("RESPONSE METRICS:")
    print(f"  ✓ Operator Reaction Time:      {metrics.reaction_time_ms:7.2f} ms")
    print(f"  ✓ Procedure Execution Time:    {metrics.procedure_execution_time_ms:7.2f} ms")
    print(f"  ✓ Total Response Time:         {metrics.total_response_time_ms:7.2f} ms")
    print(f"  ✓ Drill Success:               {metrics.success}")
    print()
    
    # Validate against heartbeat timeout
    heartbeat_timeout_ms = 500.0
    if metrics.reaction_time_ms < heartbeat_timeout_ms:
        print(f"✅ PASS: Operator reaction ({metrics.reaction_time_ms:.1f}ms) within heartbeat timeout τ ({heartbeat_timeout_ms}ms)")
    else:
        print(f"❌ FAIL: Operator reaction ({metrics.reaction_time_ms:.1f}ms) exceeded heartbeat timeout τ ({heartbeat_timeout_ms}ms)")
    
    # Check total recovery time
    max_acceptable_recovery_ms = 1500.0
    if metrics.total_response_time_ms < max_acceptable_recovery_ms:
        print(f"✅ PASS: Total recovery ({metrics.total_response_time_ms:.1f}ms) within acceptable limit ({max_acceptable_recovery_ms}ms)")
    else:
        print(f"❌ FAIL: Total recovery ({metrics.total_response_time_ms:.1f}ms) exceeded acceptable limit ({max_acceptable_recovery_ms}ms)")
    
    print()
    print("=" * 70)
    
    # Statistical analysis across multiple runs
    print("\nSTATISTICAL ANALYSIS (100 Monte Carlo Runs):")
    print("-" * 70)
    
    reaction_times = []
    procedure_times = []
    success_count = 0
    
    for run in range(100):
        # Vary operator reaction time with realistic variance
        varied_reaction = np.random.normal(350.0, 80.0)  # σ=80ms variance
        varied_procedure = np.random.normal(800.0, 150.0)  # σ=150ms variance
        
        _, _, run_events, run_metrics = simulate_operator_drill(
            operator_reaction_time_ms=max(150.0, varied_reaction),  # Min 150ms
            procedure_steps_time_ms=max(400.0, varied_procedure)   # Min 400ms
        )
        
        reaction_times.append(run_metrics.reaction_time_ms)
        procedure_times.append(run_metrics.procedure_execution_time_ms)
        if run_metrics.success:
            success_count += 1
    
    print(f"  Operator Reaction Time:")
    print(f"    Mean:   {np.mean(reaction_times):6.2f} ms")
    print(f"    StdDev: {np.std(reaction_times):6.2f} ms")
    print(f"    Min:    {np.min(reaction_times):6.2f} ms")
    print(f"    Max:    {np.max(reaction_times):6.2f} ms")
    print()
    print(f"  Procedure Execution Time:")
    print(f"    Mean:   {np.mean(procedure_times):6.2f} ms")
    print(f"    StdDev: {np.std(procedure_times):6.2f} ms")
    print(f"    Min:    {np.min(procedure_times):6.2f} ms")
    print(f"    Max:    {np.max(procedure_times):6.2f} ms")
    print()
    print(f"  Drill Success Rate: {success_count}/100 ({success_count}%)")
    print("-" * 70)
    
    return timestamps, stability, events, metrics


if __name__ == "__main__":
    run_drill_analysis()
