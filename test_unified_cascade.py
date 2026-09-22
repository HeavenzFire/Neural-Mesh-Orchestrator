"""
Test Suite for Unified Stochastic Cascade Package - Advanced Edition
=====================================================================

Comprehensive test coverage for all engine components including:
- Control strategy validation
- Stability analysis verification  
- Information metric computation
- Ensemble simulation statistics
- Export functionality

Run with: python test_unified_cascade.py
"""

import numpy as np
import sys
import unittest
from unittest.mock import patch
import warnings

# Import the package
from unified_stochastic_cascade_advanced import (
    UnifiedStochasticCascadeEngine,
    SystemParameters,
    ControlConfig,
    ControlStrategy,
    StabilityMode,
    SimulationResults,
    StabilityMetrics,
    run_verification_demo
)


class TestSystemParameters(unittest.TestCase):
    """Test SystemParameters dataclass validation."""
    
    def test_valid_parameters(self):
        """Test creation with valid parameters."""
        params = SystemParameters(
            num_tiers=4,
            r=[1.0, 0.8, 0.6, 0.4],
            K=[1.0, 2.0, 4.0, 8.0],
            beta=[0.5, 0.4, 0.3],
            mu=[0.0, 0.1, 0.1, 0.1],
            sigma=[0.02, 0.05, 0.1, 0.15],
            tau=[0.0, 2.0, 4.0, 6.0]
        )
        self.assertEqual(params.num_tiers, 4)
        self.assertEqual(len(params.r), 4)
        
    def test_dimension_mismatch_r(self):
        """Test detection of r dimension mismatch."""
        with self.assertRaises(AssertionError):
            SystemParameters(
                num_tiers=4,
                r=[1.0, 0.8, 0.6],  # Wrong length
                K=[1.0, 2.0, 4.0, 8.0],
                beta=[0.5, 0.4, 0.3],
                mu=[0.0, 0.1, 0.1, 0.1],
                sigma=[0.02, 0.05, 0.1, 0.15],
                tau=[0.0, 2.0, 4.0, 6.0]
            )
            
    def test_dimension_mismatch_beta(self):
        """Test detection of beta dimension mismatch."""
        with self.assertRaises(AssertionError):
            SystemParameters(
                num_tiers=4,
                r=[1.0, 0.8, 0.6, 0.4],
                K=[1.0, 2.0, 4.0, 8.0],
                beta=[0.5, 0.4],  # Wrong length (should be 3)
                mu=[0.0, 0.1, 0.1, 0.1],
                sigma=[0.02, 0.05, 0.1, 0.15],
                tau=[0.0, 2.0, 4.0, 6.0]
            )


class TestControlConfig(unittest.TestCase):
    """Test ControlConfig dataclass."""
    
    def test_default_values(self):
        """Test default control configuration."""
        config = ControlConfig()
        self.assertEqual(config.U_max, 4.0)
        self.assertEqual(config.strategy, ControlStrategy.BOUNDED_LQR)
        self.assertEqual(len(config.Q_weights), 4)
        
    def test_custom_strategy(self):
        """Test custom control strategy."""
        config = ControlConfig(strategy=ControlStrategy.ROBUST_HINF, hinf_gamma=3.0)
        self.assertEqual(config.strategy, ControlStrategy.ROBUST_HINF)
        self.assertEqual(config.hinf_gamma, 3.0)


class TestEngineInitialization(unittest.TestCase):
    """Test engine initialization with various configurations."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.system_params = {
            'num_tiers': 3,
            'r': [1.0, 0.8, 0.6],
            'K': [1.0, 2.0, 4.0],
            'beta': [0.5, 0.4],
            'mu': [0.0, 0.1, 0.1],
            'sigma': [0.02, 0.05, 0.1],
            'tau': [0.0, 2.0, 4.0],
            'dt': 0.01,
            'total_time': 10.0
        }
        self.control_params = {
            'Q_weights': [20.0, 20.0, 20.0],
            'R_weights': [1.0, 1.0, 1.0],
            'U_max': 4.0
        }
        
    def test_init_with_dicts(self):
        """Test initialization with dictionary parameters."""
        engine = UnifiedStochasticCascadeEngine(
            num_tiers=3,
            params=self.system_params,
            control_config=self.control_params
        )
        self.assertEqual(engine.n, 3)
        self.assertIsNotNone(engine.K_gain)
        
    def test_init_with_objects(self):
        """Test initialization with parameter objects."""
        sys_params = SystemParameters(**self.system_params)
        ctrl_config = ControlConfig(**self.control_params)
        engine = UnifiedStochasticCascadeEngine(
            num_tiers=3,
            params=sys_params,
            control_config=ctrl_config
        )
        self.assertEqual(engine.n, 3)
        
    def test_different_control_strategies(self):
        """Test initialization with different control strategies."""
        for strategy in [ControlStrategy.LQR, ControlStrategy.BOUNDED_LQR, 
                        ControlStrategy.ROBUST_HINF]:
            ctrl_params = self.control_params.copy()
            ctrl_params['strategy'] = strategy
            engine = UnifiedStochasticCascadeEngine(
                num_tiers=3,
                params=self.system_params,
                control_config=ctrl_params
            )
            self.assertIsNotNone(engine.K_gain)


class TestClosedLoopSimulation(unittest.TestCase):
    """Test closed-loop simulation functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        system_params = {
            'num_tiers': 3,
            'r': [1.0, 0.8, 0.6],
            'K': [1.0, 2.0, 4.0],
            'beta': [0.5, 0.4],
            'mu': [0.0, 0.1, 0.1],
            'sigma': [0.02, 0.05, 0.1],
            'tau': [0.0, 1.0, 2.0],
            'dt': 0.01,
            'total_time': 5.0
        }
        control_params = {
            'Q_weights': [20.0, 20.0, 20.0],
            'R_weights': [1.0, 1.0, 1.0],
            'U_max': 4.0
        }
        self.engine = UnifiedStochasticCascadeEngine(
            num_tiers=3,
            params=system_params,
            control_config=control_params
        )
        self.targets = np.array([[1.0, 2.0, 4.0] for _ in range(500)])
        
    def test_simulation_runs(self):
        """Test that simulation completes without errors."""
        results = self.engine.execute_closed_loop(
            initial_densities=[0.1, 0.0, 0.0],
            target_trajectory=self.targets
        )
        self.assertIsInstance(results, SimulationResults)
        self.assertEqual(len(results.states), len(self.targets))
        
    def test_state_non_negativity(self):
        """Test that states remain non-negative."""
        results = self.engine.execute_closed_loop(
            initial_densities=[0.1, 0.0, 0.0],
            target_trajectory=self.targets
        )
        self.assertTrue(np.all(results.states >= 0))
        
    def test_cost_breakdown(self):
        """Test cost breakdown structure."""
        results = self.engine.execute_closed_loop(
            initial_densities=[0.1, 0.0, 0.0],
            target_trajectory=self.targets
        )
        self.assertIn('state_tracking_cost', results.cost_breakdown)
        self.assertIn('control_effort_cost', results.cost_breakdown)
        self.assertIn('total_cost', results.cost_breakdown)
        total = results.cost_breakdown['state_tracking_cost'] + \
                results.cost_breakdown['control_effort_cost']
        self.assertAlmostEqual(results.cost_breakdown['total_cost'], total, places=5)
        
    def test_convergence_metrics(self):
        """Test convergence metrics computation."""
        results = self.engine.execute_closed_loop(
            initial_densities=[0.1, 0.0, 0.0],
            target_trajectory=self.targets
        )
        self.assertIn('final_error', results.convergence_metrics)
        self.assertIn('average_error', results.convergence_metrics)
        self.assertIn('maximum_error', results.convergence_metrics)


class TestStabilityAnalysis(unittest.TestCase):
    """Test stability and information metric analysis."""
    
    def setUp(self):
        """Set up test fixtures."""
        system_params = {
            'num_tiers': 3,
            'r': [1.0, 0.8, 0.6],
            'K': [1.0, 2.0, 4.0],
            'beta': [0.5, 0.4],
            'mu': [0.0, 0.1, 0.1],
            'sigma': [0.02, 0.05, 0.1],
            'tau': [0.0, 1.0, 2.0],
            'dt': 0.01,
            'total_time': 10.0
        }
        control_params = {
            'Q_weights': [20.0, 20.0, 20.0],
            'R_weights': [1.0, 1.0, 1.0],
            'U_max': 4.0
        }
        self.engine = UnifiedStochasticCascadeEngine(
            num_tiers=3,
            params=system_params,
            control_config=control_params
        )
        self.targets = np.array([[1.0, 2.0, 4.0] for _ in range(1000)])
        self.results = self.engine.execute_closed_loop(
            initial_densities=[0.1, 0.0, 0.0],
            target_trajectory=self.targets
        )
        
    def test_lyapunov_spectrum(self):
        """Test Lyapunov spectrum computation."""
        metrics = self.engine.analyze_stability_and_entropy(
            states=self.results.states,
            control=self.results.controls,
            targets=self.results.targets,
            analysis_mode=StabilityMode.LYAPUNOV
        )
        self.assertEqual(len(metrics.lyapunov_spectrum), 3)
        self.assertIsInstance(metrics.max_lyapunov_exponent, float)
        
    def test_kl_divergence(self):
        """Test KL divergence computation."""
        metrics = self.engine.analyze_stability_and_entropy(
            states=self.results.states,
            control=self.results.controls,
            targets=self.results.targets,
            analysis_mode=StabilityMode.LYAPUNOV
        )
        self.assertGreaterEqual(metrics.kl_divergence, 0.0)
        
    def test_all_metrics(self):
        """Test computation of all metrics."""
        metrics = self.engine.analyze_stability_and_entropy(
            states=self.results.states,
            control=self.results.controls,
            targets=self.results.targets,
            analysis_mode=StabilityMode.ALL
        )
        self.assertIsNotNone(metrics.lyapunov_spectrum)
        self.assertIsNotNone(metrics.kl_divergence)
        # These may be None if computation fails gracefully
        # but should not raise exceptions


class TestEnsembleSimulation(unittest.TestCase):
    """Test Monte Carlo ensemble simulation."""
    
    def setUp(self):
        """Set up test fixtures."""
        system_params = {
            'num_tiers': 2,
            'r': [1.0, 0.8],
            'K': [1.0, 2.0],
            'beta': [0.5],
            'mu': [0.0, 0.1],
            'sigma': [0.02, 0.05],
            'tau': [0.0, 1.0],
            'dt': 0.01,
            'total_time': 5.0
        }
        control_params = {
            'Q_weights': [20.0, 20.0],
            'R_weights': [1.0, 1.0],
            'U_max': 4.0
        }
        self.engine = UnifiedStochasticCascadeEngine(
            num_tiers=2,
            params=system_params,
            control_config=control_params
        )
        self.targets = np.array([[1.0, 2.0] for _ in range(500)])
        
    def test_ensemble_statistics(self):
        """Test ensemble statistics computation."""
        stats = self.engine.run_ensemble_simulation(
            initial_densities=[0.1, 0.0],
            target_trajectory=self.targets,
            num_trajectories=10
        )
        self.assertIn('mean_states', stats)
        self.assertIn('std_states', stats)
        self.assertEqual(stats['mean_states'].shape[1], 2)
        
    def test_cost_statistics(self):
        """Test cost statistics computation."""
        stats = self.engine.run_ensemble_simulation(
            initial_densities=[0.1, 0.0],
            target_trajectory=self.targets,
            num_trajectories=10
        )
        self.assertIn('cost_mean', stats)
        self.assertIn('cost_std', stats)
        self.assertGreater(stats['cost_std'], 0)  # Should have variation


class TestExportFunctionality(unittest.TestCase):
    """Test result export functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        system_params = {
            'num_tiers': 2,
            'r': [1.0, 0.8],
            'K': [1.0, 2.0],
            'beta': [0.5],
            'mu': [0.0, 0.1],
            'sigma': [0.02, 0.05],
            'tau': [0.0, 1.0],
            'dt': 0.01,
            'total_time': 2.0
        }
        control_params = {
            'Q_weights': [20.0, 20.0],
            'R_weights': [1.0, 1.0],
            'U_max': 4.0
        }
        self.engine = UnifiedStochasticCascadeEngine(
            num_tiers=2,
            params=system_params,
            control_config=control_params
        )
        self.targets = np.array([[1.0, 2.0] for _ in range(200)])
        self.results = self.engine.execute_closed_loop(
            initial_densities=[0.1, 0.0],
            target_trajectory=self.targets
        )
        self.metrics = self.engine.analyze_stability_and_entropy(
            states=self.results.states,
            control=self.results.controls,
            targets=self.results.targets
        )
        
    def test_json_export(self):
        """Test JSON export."""
        import tempfile
        import os
        import json
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_file = f.name
            
        try:
            self.engine.export_results(self.results, self.metrics, temp_file, format='json')
            with open(temp_file, 'r') as f:
                data = json.load(f)
            self.assertIn('metadata', data)
            self.assertIn('results', data)
            self.assertIn('metrics', data)
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)
                
    def test_numpy_export(self):
        """Test NumPy export."""
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.npz', delete=False) as f:
            temp_file = f.name
            
        try:
            self.engine.export_results(self.results, self.metrics, temp_file, format='numpy')
            # Check file exists and can be loaded
            data = np.load(temp_file.replace('.npz', '.npz'))
            self.assertIn('states', data.files)
        finally:
            # Clean up both possible extensions
            for ext in ['.npz', '']:
                try:
                    os.remove(temp_file.replace('.npz', ext))
                except FileNotFoundError:
                    pass


class TestVerificationDemo(unittest.TestCase):
    """Test the verification demo function."""
    
    def test_demo_runs(self):
        """Test that demo runs without errors."""
        # Suppress output during test
        with patch('sys.stdout'):
            results, metrics = run_verification_demo(verbose=False)
        self.assertIsInstance(results, SimulationResults)
        self.assertIsInstance(metrics, StabilityMetrics)
        
    def test_demo_stability(self):
        """Test that demo produces stable system."""
        results, metrics = run_verification_demo(verbose=False)
        # Max Lyapunov exponent should be negative for stability
        self.assertLess(metrics.max_lyapunov_exponent, 0)


if __name__ == '__main__':
    # Run tests with verbosity
    unittest.main(verbosity=2)
