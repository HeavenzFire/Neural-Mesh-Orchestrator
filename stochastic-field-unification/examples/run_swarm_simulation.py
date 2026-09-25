#!/usr/bin/env python3
"""
Swarm Cascade Simulation Demo

This example demonstrates the Unified Stochastic Cascade Engine for multi-tier
decentralized network control with bounded HJB optimal feedback.

Features demonstrated:
- Stochastic delay-differential equation simulation
- Hamilton-Jacobi-Bellman optimal control with sigmoidal gating
- Lyapunov spectrum stability analysis
- Kullback-Leibler divergence tracking
- Monte Carlo ensemble statistics

Run this script after installing dependencies:
    pip install -r requirements.txt
"""

import numpy as np
from core.stochastic_cascade_engine import (
    UnifiedStochasticCascadeEngine,
    ControlStrategy,
    StabilityMode,
    run_verification_demo
)


def main():
    """Execute comprehensive swarm cascade simulation demo."""
    
    print("=" * 70)
    print("SWARM CASCADE SIMULATION DEMO")
    print("Unified Stochastic Cascade Engine for Decentralized Network Control")
    print("=" * 70)
    print()
    
    # Define system parameters for a 4-tier cascade network
    system_params = {
        'num_tiers': 4,
        'r': [1.0, 0.8, 0.6, 0.4],           # Growth rates
        'K': [1.0, 2.0, 4.0, 8.0],           # Carrying capacities
        'beta': [0.5, 0.4, 0.3],             # Inter-tier coupling strengths
        'mu': [0.0, 0.1, 0.1, 0.1],          # Mortality/decay rates
        'sigma': [0.02, 0.05, 0.1, 0.15],    # Noise intensities (increasing down tiers)
        'tau': [0.0, 2.0, 4.0, 6.0],         # Time delays between tiers
        'dt': 0.01,                          # Time step
        'total_time': 50.0                   # Simulation duration
    }
    
    # Control configuration with LQR weights
    control_config = {
        'Q_weights': [20.0, 20.0, 20.0, 20.0],  # State tracking penalty
        'R_weights': [1.0, 1.0, 1.0, 1.0],      # Control effort penalty
        'U_max': 4.0,                            # Maximum control magnitude
        'strategy': ControlStrategy.BOUNDED_LQR  # Bounded LQR with sigmoidal gating
    }
    
    # Create target trajectory (constant setpoint for all tiers)
    num_steps = int(system_params['total_time'] / system_params['dt'])
    target_setpoint = np.array([1.0, 2.0, 4.0, 8.0])  # Match carrying capacities
    target_trajectory = np.tile(target_setpoint, (num_steps, 1))
    
    print("SYSTEM CONFIGURATION:")
    print(f"  Number of tiers:     {system_params['num_tiers']}")
    print(f"  Time step:           {system_params['dt']}")
    print(f"  Total time:          {system_params['total_time']}")
    print(f"  Control strategy:    {control_config['strategy'].name}")
    print(f"  Max control (U_max): {control_config['U_max']}")
    print()
    
    print("TIER PARAMETERS:")
    print(f"  {'Tier':<6} {'r':<8} {'K':<8} {'β':<8} {'μ':<8} {'σ':<8} {'τ':<8}")
    print(f"  {'-'*6} {'-'*8} {'-'*8} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")
    for i in range(system_params['num_tiers']):
        beta_val = system_params['beta'][i] if i < len(system_params['beta']) else 0.0
        print(f"  {i:<6} {system_params['r'][i]:<8.2f} {system_params['K'][i]:<8.2f} "
              f"{beta_val:<8.2f} {system_params['mu'][i]:<8.2f} {system_params['sigma'][i]:<8.2f} "
              f"{system_params['tau'][i]:<8.2f}")
    print()
    
    # Initialize the engine
    print("Initializing Unified Stochastic Cascade Engine...")
    engine = UnifiedStochasticCascadeEngine(
        num_tiers=system_params['num_tiers'],
        params=system_params,
        control_config=control_config
    )
    print("  ✓ Engine initialized")
    print(f"  ✓ Riccati matrix P computed (shape: {engine.P.shape})")
    print(f"  ✓ Optimal gain K computed (shape: {engine.K_gain.shape})")
    print()
    
    # Initial conditions (perturbed from equilibrium)
    initial_densities = np.array([0.1, 0.0, 0.0, 0.0])
    print(f"Initial state: {initial_densities}")
    print(f"Target state:  {target_setpoint}")
    print()
    
    # Execute closed-loop simulation
    print("Running closed-loop simulation with HJB optimal control...")
    print("-" * 70)
    
    results_obj = engine.execute_closed_loop(
        initial_densities=initial_densities,
        target_trajectory=target_trajectory
    )
    
    # Handle both tuple and SimulationResults return types
    if hasattr(results_obj, 'states'):
        states = results_obj.states
        controls = results_obj.controls
        total_cost = results_obj.total_cost
    else:
        states, controls, total_cost = results_obj
    
    print("-" * 70)
    print()
    
    # Analyze stability and information metrics
    print("Analyzing stability spectrum and information divergence...")
    metrics = engine.analyze_stability_and_entropy(
        states=states,
        control=controls,
        targets=target_trajectory,
        analysis_mode=StabilityMode.ALL
    )
    print()
    
    # Display results
    print("=" * 70)
    print("SIMULATION RESULTS")
    print("=" * 70)
    print()
    
    print("TRAJECTORY STATISTICS:")
    print(f"  Final state mean:    {np.mean(states[-10:], axis=0)}")
    print(f"  Final state std:     {np.std(states[-10:], axis=0)}")
    print(f"  Target state:        {target_setpoint}")
    print(f"  Final tracking error: {np.linalg.norm(states[-1] - target_setpoint):.6f}")
    print()
    
    print("COST BREAKDOWN:")
    print(f"  Total cost:          {total_cost:.4f}")
    print(f"  Average cost/step:   {total_cost / len(states):.6f}")
    print(f"  Max control used:    {np.max(np.abs(controls)):.4f} (limit: {control_config['U_max']})")
    print()
    
    print("STABILITY & INFORMATION METRICS:")
    # Convert StabilityMetrics dataclass to dict for access
    metrics_dict = metrics.to_dict() if hasattr(metrics, 'to_dict') else metrics
    
    lyap_spectrum = metrics_dict.get('lyapunov_spectrum', [])
    if len(lyap_spectrum) > 0:
        print(f"  Max Lyapunov exponent: {metrics_dict.get('max_lyapunov_exponent', lyap_spectrum[0]):.6f}")
        stability_status = "✓ STABLE" if metrics_dict.get('max_lyapunov_exponent', lyap_spectrum[0]) < 0 else "✗ UNSTABLE"
        print(f"  Stability status:      {stability_status}")
        print(f"  Full spectrum:         {[f'{x:.4f}' for x in lyap_spectrum]}")
    
    kl_div = metrics_dict.get('kl_divergence', 0.0)
    print(f"  KL divergence:         {kl_div:.4f} nats")
    
    stability_margin = metrics_dict.get('stability_margin', 0.0)
    print(f"  Stability margin:      {stability_margin:.4f}")
    print()
    
    # Verification summary
    print("=" * 70)
    print("VERIFICATION SUMMARY")
    print("=" * 70)
    
    checks_passed = 0
    total_checks = 4
    
    # Check 1: Stability
    if len(lyap_spectrum) > 0 and lyap_spectrum[0] < 0:
        print("  ✓ Closed-loop stability: VERIFIED")
        checks_passed += 1
    else:
        print("  ✗ Closed-loop stability: NOT VERIFIED")
    
    # Check 2: Tracking performance
    final_error = np.linalg.norm(states[-1] - target_setpoint)
    if final_error < 0.5 * np.linalg.norm(target_setpoint):
        print("  ✓ Tracking performance: ACCEPTABLE")
        checks_passed += 1
    else:
        print("  ✗ Tracking performance: POOR")
    
    # Check 3: Control bounds respected
    max_control_used = np.max(np.abs(controls))
    if max_control_used <= control_config['U_max'] * 1.01:  # 1% tolerance
        print("  ✓ Control bounds: RESPECTED")
        checks_passed += 1
    else:
        print("  ✗ Control bounds: VIOLATED")
    
    # Check 4: Information preservation
    if kl_div < 100.0:  # Reasonable threshold
        print("  ✓ Information preservation: GOOD")
        checks_passed += 1
    else:
        print("  ✗ Information preservation: POOR")
    
    print()
    print(f"Checks passed: {checks_passed}/{total_checks}")
    print("=" * 70)
    
    # Optional: Run Monte Carlo ensemble for statistical robustness
    print()
    print("Running Monte Carlo ensemble (10 trajectories)...")
    ensemble_stats = engine.run_ensemble_simulation(
        initial_densities=initial_densities,
        target_trajectory=target_trajectory,
        num_trajectories=10
    )
    
    print(f"  Mean final cost:       {ensemble_stats.get('cost_mean', 0):.4f}")
    print(f"  Cost std deviation:    {ensemble_stats.get('cost_std', 0):.4f}")
    
    # Compute percentiles from the stats if available
    if 'percentile_95' in ensemble_stats:
        p95_costs = ensemble_stats['percentile_95']
        print(f"  Cost 95th percentile:  {np.max(p95_costs):.4f} (max across tiers)")
    print()
    
    print("=" * 70)
    print("DEMO COMPLETE")
    print("=" * 70)
    
    return {
        'states': states,
        'controls': controls,
        'total_cost': total_cost,
        'metrics': metrics,
        'ensemble_stats': ensemble_stats
    }


if __name__ == "__main__":
    results = main()
