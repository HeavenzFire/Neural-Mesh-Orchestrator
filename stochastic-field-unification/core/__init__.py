"""
Stochastic Field Unification Suite - Core Package

This package provides dual-layer mathematical simulation architecture bridging:
1. Macroscopic decentralized control engineering (stochastic cascades)
2. Microscopic quantum-geometric field theories (Palatini formalism, FRG, etc.)

Modules:
    stochastic_cascade_engine: HJB control, Lyapunov analysis, KL divergence
    quantum_cosmology_suite: Palatini formalism, Einstein-Cartan, stochastic quantization
"""

from .stochastic_cascade_engine import (
    UnifiedStochasticCascadeEngine,
    SystemParameters,
    ControlConfig,
    SimulationResults,
    StabilityMetrics,
    ControlStrategy,
    StabilityMode,
    run_verification_demo
)

from .quantum_cosmology_suite import (
    PalatiniFormalism,
    MetricTensor,
    AffineConnection,
    ElectromagneticField
)

__version__ = "1.0.0"
__author__ = "Stochastic Field Unification Team"
__all__ = [
    # Stochastic Cascade Engine
    "UnifiedStochasticCascadeEngine",
    "SystemParameters",
    "ControlConfig",
    "SimulationResults",
    "StabilityMetrics",
    "ControlStrategy",
    "StabilityMode",
    "run_verification_demo",
    
    # Quantum Cosmology Suite
    "PalatiniFormalism",
    "MetricTensor",
    "AffineConnection",
    "ElectromagneticField",
]
