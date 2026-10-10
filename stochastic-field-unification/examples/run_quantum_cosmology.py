#!/usr/bin/env python3
"""
Quantum Cosmology & Field Unification Demo

This example demonstrates the advanced quantum field theory and general relativity
tools in the Stochastic Field Unification Suite, including:

- Palatini metric-affine variational formalism
- Einstein-Cartan theory with torsion
- Functional Renormalization Group (FRG) flows
- Parisi-Wu stochastic quantization
- Hartle-Hawking no-boundary wavefunction

Run this script after installing dependencies:
    pip install -r requirements.txt
"""

import sys
from pathlib import Path

# Ensure the package root (stochastic-field-unification/) is importable
# regardless of the caller's working directory.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
from core.quantum_cosmology_suite import (
    PalatiniFormalism,
    FormalismType,
    MetricTensor,
    AffineConnection,
    ElectromagneticField,
    schwarzschild_metric,
    kerr_metric,
    uniform_em_field,
)


def demo_palatini_formalism():
    """Demonstrate the Palatini metric-affine variational formalism."""

    print("=" * 70)
    print("PALATINI FORMALISM: Metric-Affine Variational Fields")
    print("=" * 70)
    print()

    # Create Palatini formalism engine (vacuum sector)
    palatini = PalatiniFormalism(formalism_type=FormalismType.VACUUM)

    print("Testing on Schwarzschild metric (vacuum solution)...")
    print("-" * 70)

    # Schwarzschild parameters
    M = 1.0  # Mass parameter
    r_sch = 4.0  # Test radius (outside horizon at r=2M=2)

    # Compute Schwarzschild metric at test point (standalone function)
    g_schwarzschild = schwarzschild_metric(r_sch, M)

    print(f"Coordinates: (t, r, θ, φ) = (0.0, {r_sch}, {np.pi/2:.4f}, 0.0)")
    print(f"Metric determinant: {g_schwarzschild.determinant:.6e}")
    print()

    # Solve for the metric-compatible connection (Palatini variation of Γ)
    conn_sw = palatini.solve_metric_compatibility(g_schwarzschild)
    print(f"Connection symmetric: {conn_sw.is_symmetric}")
    print(f"Has torsion: {conn_sw.has_torsion()}")

    # Verify vacuum Einstein equations with the independent connection
    einstein_sw = palatini.verify_einstein_equations(g_schwarzschild, conn_sw)
    print(f"Einstein equation residual: {einstein_sw['max_residual']:.6e}")

    is_vacuum_solution = einstein_sw['is_solution']
    print(f"Vacuum solution verified: {'✓ YES' if is_vacuum_solution else '✗ NO'}")
    print()

    # Test Kerr rotating black hole
    print("Testing on Kerr rotating black hole metric...")
    print("-" * 70)

    a = 0.5  # Spin parameter (a = J/M)
    r_kerr = 5.0
    theta_kerr = np.pi / 3

    g_kerr = kerr_metric(r_kerr, theta_kerr, M, a)
    conn_kerr = palatini.solve_metric_compatibility(g_kerr)
    einstein_kerr = palatini.verify_einstein_equations(g_kerr, conn_kerr)

    print(f"Coordinates: (t, r, θ, φ) = (0.0, {r_kerr}, {theta_kerr:.4f}, 0.0)")
    print(f"Spin parameter: a = {a}")
    print(f"Metric determinant: {g_kerr.determinant:.6e}")
    print(f"Einstein equation residual: {einstein_kerr['max_residual']:.6e}")

    is_kerr_solution = einstein_kerr['is_solution']
    print(f"Kerr solution verified: {'✓ YES' if is_kerr_solution else '✗ NO'}")
    print()

    return {
        'schwarzschild_verified': is_vacuum_solution,
        'kerr_verified': is_kerr_solution
    }


def demo_einstein_cartan_torsion():
    """Demonstrate Einstein-Cartan theory with spacetime torsion."""
    
    print("=" * 70)
    print("EINSTEIN-CARTAN THEORY: Spacetime Torsion as Gauge Field")
    print("=" * 70)
    print()
    print("Note: EinsteinCartanTheory class not yet implemented in this version.")
    print("      This feature is planned for a future release.")
    print()
    return {
        'torsion_applied': False,
        'torsion_scalar': None
    }


def demo_em_coupling():
    """Demonstrate electromagnetic field coupling in curved spacetime."""

    print("=" * 70)
    print("ELECTROMAGNETIC COUPLING: Maxwell Fields in Curved Spacetime")
    print("=" * 70)
    print()

    # Uniform EM field on a flat (Minkowski) background
    g_background = MetricTensor(components=np.diag([-1.0, 1.0, 1.0, 1.0]))

    E_vec = np.array([0.1, 0.0, 0.0])   # Radial electric field
    B_vec = np.array([0.0, 0.0, 0.05])  # Axial magnetic field
    em = uniform_em_field(E_vec, B_vec)
    F = em.components

    print("Electromagnetic field tensor F_μν:")
    print(f"  Electric field (radial): E_r = {E_vec[0]}")
    print(f"  Magnetic field (axial):  B_z = {B_vec[2]}")
    print()

    # Invariants and stress-energy via the core module API
    T_EM = em.compute_stress_energy(g_background)
    g_inv = g_background.inverse
    invariant_F = float(np.einsum('mn,mp,nq->', F, g_inv, F))  # F_μν F^μν

    eps = np.zeros((4, 4, 4, 4))
    from itertools import permutations
    for perm in permutations(range(4)):
        sig = 1
        for i in range(4):
            for j in range(i + 1, 4):
                if perm[i] > perm[j]:
                    sig = -sig
        eps[perm] = sig
    invariant_G = float(0.25 * np.einsum('mn,mnpq,pq->', F, eps, F))  # F ∧ F proxy

    print("EM invariants:")
    print(f"  F_μν F^μν = {invariant_F:.6e}")
    print(f"  F_μν *F^μν = {invariant_G:.6e}")
    print()
    print("Electromagnetic stress-energy tensor T_μν:")
    print(f"  Energy density T_00 = {T_EM[0, 0]:.6e}")
    print(f"  Trace T^μ_μ = {np.trace(T_EM):.6e}")
    print()

    return {
        'invariant_F': invariant_F,
        'invariant_G': invariant_G,
        'energy_density': float(T_EM[0, 0])
    }


def demo_frg_flow():
    """Demonstrate Functional Renormalization Group flow equations."""
    print("=" * 70)
    print("FUNCTIONAL RENORMALIZATION GROUP: Wetterich Equation")
    print("=" * 70)
    print()
    print("Note: FRG module not yet implemented in this version.")
    print("      This feature is planned for a future release.")
    print()
    return {'lambda_ir': None}


def demo_stochastic_quantization():
    """Demonstrate Parisi-Wu stochastic quantization."""
    print("=" * 70)
    print("PARISI-WU STOCHASTIC QUANTIZATION: Fifth-Time Relaxation")
    print("=" * 70)
    print()
    print("Note: Stochastic quantization module not yet implemented.")
    print("      This feature is planned for a future release.")
    print()
    return {'field_mean': None}


def demo_hartle_hawking():
    """Demonstrate Hartle-Hawking no-boundary wavefunction."""
    print("=" * 70)
    print("HARTLE-HAWKING WAVEFUNCTION: No-Boundary Proposal")
    print("=" * 70)
    print()
    print("Note: Hartle-Hawking wavefunction module not yet implemented.")
    print("      This feature is planned for a future release.")
    print()
    return {'most_probable_a': None}


def main():
    """Execute comprehensive quantum cosmology demonstration."""
    
    print()
    print("*" * 70)
    print("QUANTUM COSMOLOGY & FIELD UNIFICATION DEMO")
    print("Stochastic Field Unification Suite")
    print("*" * 70)
    print()
    
    results = {}
    
    # Demo 1: Palatini Formalism
    results['palatini'] = demo_palatini_formalism()
    
    # Demo 2: Einstein-Cartan Torsion
    results['einstein_cartan'] = demo_einstein_cartan_torsion()
    
    # Demo 3: EM Coupling
    results['em_coupling'] = demo_em_coupling()
    
    # Demo 4: FRG Flow
    results['frg'] = demo_frg_flow()
    
    # Demo 5: Stochastic Quantization
    results['stochastic_quant'] = demo_stochastic_quantization()
    
    # Demo 6: Hartle-Hawking Wavefunction
    results['hartle_hawking'] = demo_hartle_hawking()
    
    # Summary
    print("=" * 70)
    print("DEMONSTRATION SUMMARY")
    print("=" * 70)
    print()
    
    summary_checks = [
        ('Palatini (Schwarzschild)', results['palatini']['schwarzschild_verified']),
        ('Palatini (Kerr)', results['palatini']['kerr_verified']),
        ('Einstein-Cartan Torsion', results['einstein_cartan']['torsion_applied']),
        ('EM Stress-Energy', results['em_coupling']['energy_density'] is not None),
        ('FRG Flow Integration', results['frg']['lambda_ir'] is not None),
        ('Stochastic Quantization', results['stochastic_quant']['field_mean'] is not None),
        ('Hartle-Hawking Wavefunction', results['hartle_hawking']['most_probable_a'] is not None),
    ]
    
    passed = 0
    for name, check in summary_checks:
        status = "✓" if check else "✗"
        print(f"  {status} {name}")
        if check:
            passed += 1
    
    print()
    print(f"Checks passed: {passed}/{len(summary_checks)}")
    print()
    print("=" * 70)
    print("DEMO COMPLETE")
    print("=" * 70)
    print()
    print("For detailed documentation, see the module docstrings.")
    print("Each component can be imported and used independently.")
    print()
    
    return results


if __name__ == "__main__":
    results = main()
