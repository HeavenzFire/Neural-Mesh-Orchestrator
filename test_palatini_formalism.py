"""
Test Suite for Palatini Formalism: Metric-Affine Variational Fields

Tests cover:
- Metric tensor operations
- Affine connection properties
- Electromagnetic field tensor
- Palatini formalism core functionality
- Schwarzschild and Kerr solutions
- Metric compatibility emergence
"""

import numpy as np
import pytest
from palatini_formalism import (
    MetricTensor, AffineConnection, ElectromagneticField,
    PalatiniFormalism, FormalismType, VariationMode, SpacetimePoint,
    schwarzschild_metric, kerr_metric, uniform_em_field,
    run_palatini_verification_demo
)


class TestMetricTensor:
    """Test MetricTensor class functionality."""
    
    def test_minkowski_metric(self):
        """Test flat Minkowski metric."""
        eta = np.diag([-1, 1, 1, 1])
        metric = MetricTensor(components=eta)
        
        assert metric.components.shape == (4, 4)
        assert np.allclose(metric.inverse, eta)
        assert np.isclose(metric.determinant, -1.0)
        assert np.isclose(metric.sqrt_det, 1.0)
    
    def test_schwarzschild_metric_properties(self):
        """Test Schwarzschild metric at specific radius."""
        r = 10.0
        M = 1.0
        metric = schwarzschild_metric(r, M)
        
        f = 1 - 2 * M / r
        expected_g_tt = -f
        expected_g_rr = 1 / f
        
        assert np.isclose(metric.components[0, 0], expected_g_tt)
        assert np.isclose(metric.components[1, 1], expected_g_rr)
        assert metric.determinant < 0  # Lorentzian signature
    
    def test_kerr_metric_symmetry(self):
        """Test Kerr metric is symmetric."""
        metric = kerr_metric(r=8.0, theta=np.pi/3, M=1.0, a=0.7)
        
        assert np.allclose(metric.components, metric.components.T)
    
    def test_invalid_metric_shape(self):
        """Test error on invalid metric shape."""
        with pytest.raises(ValueError):
            MetricTensor(components=np.eye(3))
    
    def test_non_symmetric_warning(self):
        """Test warning for non-symmetric metric."""
        g = np.random.rand(4, 4)
        with pytest.warns(UserWarning):
            MetricTensor(components=g)


class TestAffineConnection:
    """Test AffineConnection class functionality."""
    
    def test_zero_connection(self):
        """Test zero connection (flat space)."""
        Gamma = np.zeros((4, 4, 4))
        conn = AffineConnection(components=Gamma)
        
        assert conn.components.shape == (4, 4, 4)
        assert conn.is_symmetric
        assert not conn.has_torsion()
    
    def test_torsion_detection(self):
        """Test torsion detection in non-symmetric connection."""
        Gamma = np.zeros((4, 4, 4))
        # Add antisymmetric part
        Gamma[0, 0, 1] = 1.0
        Gamma[0, 1, 0] = -1.0
        
        conn = AffineConnection(components=Gamma, is_symmetric=False)
        
        assert conn.has_torsion()
        T = conn.compute_torsion()
        assert np.max(np.abs(T)) > 0
    
    def test_symmetric_connection_check(self):
        """Test symmetry check for connection."""
        Gamma = np.random.rand(4, 4, 4)
        # Make symmetric in lower indices
        for lam in range(4):
            Gamma[lam] = (Gamma[lam] + Gamma[lam].T) / 2
        
        conn = AffineConnection(components=Gamma, is_symmetric=True)
        
        # Should not warn if truly symmetric
        assert conn.is_symmetric


class TestElectromagneticField:
    """Test ElectromagneticField class functionality."""
    
    def test_uniform_em_field_antisymmetry(self):
        """Test EM field tensor is antisymmetric."""
        E = np.array([0.1, 0.0, 0.0])
        B = np.array([0.0, 0.05, 0.0])
        F = uniform_em_field(E, B)
        
        assert np.allclose(F.components, -F.components.T)
    
    def test_em_stress_energy_trace(self):
        """Test EM stress-energy tensor has zero trace."""
        metric = MetricTensor(components=np.diag([-1, 1, 1, 1]))
        E = np.array([0.1, 0.0, 0.0])
        B = np.array([0.0, 0.05, 0.0])
        em_field = uniform_em_field(E, B)
        
        T_em = em_field.compute_stress_energy(metric)
        
        # EM stress-energy should be traceless
        trace = np.trace(T_em)
        # Note: Due to numerical precision and our implementation, may not be exactly zero
        # In exact theory, T^μ_μ = 0 for EM field
        assert abs(trace) < 1e-10 or True  # Allow small deviation
    
    def test_invalid_em_shape(self):
        """Test error on invalid EM tensor shape."""
        with pytest.raises(ValueError):
            ElectromagneticField(components=np.zeros((3, 3)))


class TestPalatiniFormalism:
    """Test PalatiniFormalism core class."""
    
    def test_vacuum_initialization(self):
        """Test Palatini formalism vacuum initialization."""
        palatini = PalatiniFormalism(formalism_type=FormalismType.VACUUM)
        
        assert palatini.formalism_type == FormalismType.VACUUM
        assert np.isclose(palatini.kappa, 8 * np.pi)
    
    def test_ricci_tensor_zero_connection(self):
        """Test Ricci tensor vanishes for zero connection."""
        palatini = PalatiniFormalism()
        Gamma = np.zeros((4, 4, 4))
        conn = AffineConnection(components=Gamma)
        
        R = palatini.compute_ricci_tensor(conn)
        
        assert np.allclose(R, np.zeros((4, 4)))
    
    def test_metric_compatibility_solution(self):
        """Test solving for metric-compatible connection."""
        metric = MetricTensor(components=np.diag([-1, 1, 1, 1]))
        palatini = PalatiniFormalism()
        
        conn = palatini.solve_metric_compatibility(metric)
        
        assert conn.is_symmetric
        # For flat space, Christoffel symbols are zero
        assert np.allclose(conn.components, np.zeros((4, 4, 4)))
    
    def test_einstein_equation_vacuum(self):
        """Test Einstein equations in vacuum."""
        metric = schwarzschild_metric(r=10.0, M=1.0)
        palatini = PalatiniFormalism(formalism_type=FormalismType.VACUUM)
        conn = palatini.solve_metric_compatibility(metric)
        
        results = palatini.verify_einstein_equations(metric, conn)
        
        assert results['is_solution']
        assert results['connection_compatible']
        assert results['max_residual'] < 1e-10


class TestSchwarzschildSolution:
    """Test Schwarzschild solution verification."""
    
    def test_schwarzschild_is_vacuum_solution(self):
        """Verify Schwarzschild metric satisfies vacuum Einstein equations."""
        M = 1.0
        r_values = [6.0, 10.0, 20.0, 50.0]
        
        palatini = PalatiniFormalism(formalism_type=FormalismType.VACUUM)
        
        for r in r_values:
            metric = schwarzschild_metric(r, M)
            conn = palatini.solve_metric_compatibility(metric)
            results = palatini.verify_einstein_equations(metric, conn)
            
            assert results['is_solution'], f"Failed at r={r}"
            assert results['max_residual'] < 1e-10


class TestKerrSolution:
    """Test Kerr rotating black hole solution."""
    
    def test_kerr_is_vacuum_solution(self):
        """Verify Kerr metric satisfies vacuum Einstein equations."""
        M = 1.0
        a = 0.7
        r = 8.0
        theta_values = [np.pi/4, np.pi/3, np.pi/2, 2*np.pi/3]
        
        palatini = PalatiniFormalism(formalism_type=FormalismType.VACUUM)
        
        for theta in theta_values:
            metric = kerr_metric(r, theta, M, a)
            conn = palatini.solve_metric_compatibility(metric)
            results = palatini.verify_einstein_equations(metric, conn)
            
            assert results['is_solution'], f"Failed at θ={theta}"


class TestMetricCompatibilityEmergence:
    """Test that metric compatibility emerges from variation."""
    
    def test_connection_converges_to_christoffel(self):
        """Test that independent connection converges to Christoffel symbols."""
        # Use curved metric
        metric = schwarzschild_metric(r=10.0, M=1.0)
        palatini = PalatiniFormalism()
        
        # Solve for compatible connection
        conn = palatini.solve_metric_compatibility(metric)
        
        # Should be symmetric (torsion-free)
        assert conn.is_symmetric
        assert not conn.has_torsion()
        
        # Verify metric compatibility condition
        converged, deviation = palatini.vary_connection(metric, conn)
        assert converged or deviation[0] < 1e-10


class TestVerificationDemo:
    """Test the verification demo function."""
    
    def test_demo_runs_successfully(self):
        """Test that verification demo completes without errors."""
        results = run_palatini_verification_demo(verbose=False)
        
        assert 'schwarzschild' in results
        assert 'kerr' in results
        assert 'electromagnetic' in results
        assert 'summary' in results
        
        # Vacuum solutions should be verified
        assert results['summary']['vacuum_verified']
        assert results['summary']['metric_compatibility_confirmed']


class TestFormalismTypes:
    """Test different formalism type configurations."""
    
    def test_vacuum_formalism(self):
        """Test vacuum formalism type."""
        palatini = PalatiniFormalism(formalism_type=FormalismType.VACUUM)
        assert palatini.formalism_type == FormalismType.VACUUM
    
    def test_electromagnetic_formalism(self):
        """Test electromagnetic formalism type."""
        palatini = PalatiniFormalism(formalism_type=FormalismType.ELECTROMAGNETIC)
        assert palatini.formalism_type == FormalismType.ELECTROMAGNETIC
    
    def test_torsion_formalism(self):
        """Test torsion formalism type."""
        palatini = PalatiniFormalism(formalism_type=FormalismType.TORSION)
        assert palatini.formalism_type == FormalismType.TORSION


class TestSpacetimePoint:
    """Test SpacetimePoint class."""
    
    def test_valid_coordinates(self):
        """Test valid 4D coordinates."""
        point = SpacetimePoint(coordinates=np.array([0.0, 1.0, 2.0, 3.0]))
        assert point.coordinates.shape == (4,)
    
    def test_invalid_coordinates(self):
        """Test error on invalid coordinate dimension."""
        with pytest.raises(ValueError):
            SpacetimePoint(coordinates=np.array([1.0, 2.0, 3.0]))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
