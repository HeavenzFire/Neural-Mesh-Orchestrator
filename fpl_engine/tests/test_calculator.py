"""
Unit tests for FPL Engine calculator module.

Tests cover:
- FPL percentage calculations
- Cost-of-living adjustments
- Pydantic model validation
- Edge cases (zero income, large households, boundary conditions)
"""

import pytest
from decimal import Decimal
from datetime import datetime

from fpl_engine.calculator import (
    calculate_fpl_percentage,
    get_adjusted_income,
    FamilyIncome,
    EligibilityResult
)


# --- Test FPL Percentage Calculation ---

class TestCalculateFPLPercentage:
    """Test suite for calculate_fpl_percentage function."""
    
    def test_standard_calculation(self):
        """Test standard FPL percentage calculation."""
        result = calculate_fpl_percentage(
            annual_income=Decimal("35000.00"),
            fpl_guideline=Decimal("30000.00")
        )
        assert result == Decimal("116.6667")
    
    def test_exact_100_percent(self):
        """Test when income equals FPL guideline exactly."""
        result = calculate_fpl_percentage(
            annual_income=Decimal("25000.00"),
            fpl_guideline=Decimal("25000.00")
        )
        assert result == Decimal("100.0000")
    
    def test_below_fpl(self):
        """Test income below FPL guideline."""
        result = calculate_fpl_percentage(
            annual_income=Decimal("15000.00"),
            fpl_guideline=Decimal("25000.00")
        )
        assert result == Decimal("60.0000")
    
    def test_zero_income(self):
        """Test zero income case."""
        result = calculate_fpl_percentage(
            annual_income=Decimal("0.00"),
            fpl_guideline=Decimal("25000.00")
        )
        assert result == Decimal("0.0000")
    
    def test_high_income(self):
        """Test high income relative to FPL."""
        result = calculate_fpl_percentage(
            annual_income=Decimal("100000.00"),
            fpl_guideline=Decimal("25000.00")
        )
        assert result == Decimal("400.0000")
    
    def test_invalid_fpl_guideline_zero(self):
        """Test that zero FPL guideline raises ValueError."""
        with pytest.raises(ValueError, match="FPL guideline must be greater than zero"):
            calculate_fpl_percentage(
                annual_income=Decimal("30000.00"),
                fpl_guideline=Decimal("0.00")
            )
    
    def test_invalid_fpl_guideline_negative(self):
        """Test that negative FPL guideline raises ValueError."""
        with pytest.raises(ValueError, match="FPL guideline must be greater than zero"):
            calculate_fpl_percentage(
                annual_income=Decimal("30000.00"),
                fpl_guideline=Decimal("-1000.00")
            )
    
    def test_custom_precision(self):
        """Test custom decimal precision."""
        result = calculate_fpl_percentage(
            annual_income=Decimal("35000.00"),
            fpl_guideline=Decimal("30000.00"),
            round_to=2
        )
        assert result == Decimal("116.67")
    
    def test_decimal_precision_rounding(self):
        """Test proper rounding behavior."""
        result = calculate_fpl_percentage(
            annual_income=Decimal("33333.33"),
            fpl_guideline=Decimal("30000.00"),
            round_to=4
        )
        # 33333.33 / 30000 * 100 = 111.1111
        assert result == Decimal("111.1111")


# --- Test Cost-of-Living Adjustment ---

class TestGetAdjustedIncome:
    """Test suite for get_adjusted_income function."""
    
    def test_no_adjustment(self):
        """Test with COL factor of 1.0 (no adjustment)."""
        result = get_adjusted_income(
            annual_income=Decimal("50000.00"),
            col_adjustment_factor=Decimal("1.000")
        )
        assert result == Decimal("50000.00")
    
    def test_high_col_area(self):
        """Test high cost-of-living area (factor > 1)."""
        result = get_adjusted_income(
            annual_income=Decimal("50000.00"),
            col_adjustment_factor=Decimal("1.500")
        )
        assert result == Decimal("75000.00")
    
    def test_low_col_area(self):
        """Test low cost-of-living area (factor < 1)."""
        result = get_adjusted_income(
            annual_income=Decimal("50000.00"),
            col_adjustment_factor=Decimal("0.800")
        )
        assert result == Decimal("40000.00")
    
    def test_zero_income(self):
        """Test zero income with COL adjustment."""
        result = get_adjusted_income(
            annual_income=Decimal("0.00"),
            col_adjustment_factor=Decimal("1.200")
        )
        assert result == Decimal("0.00")
    
    def test_rounding_to_cents(self):
        """Test proper rounding to cents."""
        result = get_adjusted_income(
            annual_income=Decimal("50000.333"),
            col_adjustment_factor=Decimal("1.000")
        )
        assert result == Decimal("50000.33")
    
    def test_fractional_cents_rounding(self):
        """Test rounding of fractional cents."""
        result = get_adjusted_income(
            annual_income=Decimal("50000.00"),
            col_adjustment_factor=Decimal("1.123")
        )
        # 50000 * 1.123 = 56150.00
        assert result == Decimal("56150.00")


# --- Test FamilyIncome Model Validation ---

class TestFamilyIncomeModel:
    """Test suite for FamilyIncome Pydantic model."""
    
    def test_valid_family(self):
        """Test valid family income data."""
        family = FamilyIncome(
            household_size=4,
            annual_gross_income=Decimal("75000.00"),
            state="CA"
        )
        assert family.household_size == 4
        assert family.annual_gross_income == Decimal("75000.00")
        assert family.state == "CA"
        assert family.cost_of_living_adjustment_factor == Decimal("1.000")
    
    def test_state_uppercase_conversion(self):
        """Test automatic state code uppercase conversion."""
        family = FamilyIncome(
            household_size=3,
            annual_gross_income=Decimal("45000.00"),
            state="tx"
        )
        assert family.state == "TX"
    
    def test_custom_col_factor(self):
        """Test custom COL adjustment factor."""
        family = FamilyIncome(
            household_size=2,
            annual_gross_income=Decimal("40000.00"),
            state="NY",
            cost_of_living_adjustment_factor=Decimal("1.350")
        )
        assert family.cost_of_living_adjustment_factor == Decimal("1.350")
    
    def test_invalid_household_size_zero(self):
        """Test that zero household size raises validation error."""
        with pytest.raises(Exception):  # Pydantic ValidationError
            FamilyIncome(
                household_size=0,
                annual_gross_income=Decimal("30000.00"),
                state="TX"
            )
    
    def test_invalid_household_size_negative(self):
        """Test that negative household size raises validation error."""
        with pytest.raises(Exception):
            FamilyIncome(
                household_size=-1,
                annual_gross_income=Decimal("30000.00"),
                state="TX"
            )
    
    def test_invalid_income_negative(self):
        """Test that negative income raises validation error."""
        with pytest.raises(Exception):
            FamilyIncome(
                household_size=3,
                annual_gross_income=Decimal("-5000.00"),
                state="TX"
            )
    
    def test_invalid_state_code_short(self):
        """Test that single-character state code raises validation error."""
        with pytest.raises(Exception):
            FamilyIncome(
                household_size=2,
                annual_gross_income=Decimal("35000.00"),
                state="T"
            )
    
    def test_invalid_state_code_long(self):
        """Test that three-character state code raises validation error."""
        with pytest.raises(Exception):
            FamilyIncome(
                household_size=2,
                annual_gross_income=Decimal("35000.00"),
                state="TEX"
            )
    
    def test_col_factor_lower_bound(self):
        """Test COL factor at lower bound (0.5)."""
        family = FamilyIncome(
            household_size=1,
            annual_gross_income=Decimal("25000.00"),
            state="MS",
            cost_of_living_adjustment_factor=Decimal("0.500")
        )
        assert family.cost_of_living_adjustment_factor == Decimal("0.500")
    
    def test_col_factor_upper_bound(self):
        """Test COL factor at upper bound (2.0)."""
        family = FamilyIncome(
            household_size=1,
            annual_gross_income=Decimal("25000.00"),
            state="CA",
            cost_of_living_adjustment_factor=Decimal("2.000")
        )
        assert family.cost_of_living_adjustment_factor == Decimal("2.000")
    
    def test_col_factor_out_of_range_low(self):
        """Test COL factor below 0.5 raises validation error."""
        with pytest.raises(Exception):
            FamilyIncome(
                household_size=1,
                annual_gross_income=Decimal("25000.00"),
                state="TX",
                cost_of_living_adjustment_factor=Decimal("0.499")
            )
    
    def test_col_factor_out_of_range_high(self):
        """Test COL factor above 2.0 raises validation error."""
        with pytest.raises(Exception):
            FamilyIncome(
                household_size=1,
                annual_gross_income=Decimal("25000.00"),
                state="TX",
                cost_of_living_adjustment_factor=Decimal("2.001")
            )


# --- Test EligibilityResult Model ---

class TestEligibilityResultModel:
    """Test suite for EligibilityResult Pydantic model."""
    
    def test_eligible_result(self):
        """Test eligible result creation."""
        result = EligibilityResult(
            is_eligible=True,
            fpl_percentage=Decimal("185.5000"),
            fpl_guideline=Decimal("30000.00"),
            fap_threshold_applied=Decimal("200.00"),
            coverage_type="full_charity",
            hospital_id="550e8400-e29b-41d4-a716-446655440000",
            assessment_year=2024
        )
        assert result.is_eligible is True
        assert result.coverage_type == "full_charity"
        assert result.notes is None
    
    def test_ineligible_result(self):
        """Test ineligible result creation."""
        result = EligibilityResult(
            is_eligible=False,
            fpl_percentage=Decimal("450.0000"),
            fpl_guideline=Decimal("30000.00"),
            fap_threshold_applied=Decimal("400.00"),
            coverage_type="none",
            hospital_id="550e8400-e29b-41d4-a716-446655440000",
            assessment_year=2024,
            notes="Income exceeds all available FAP thresholds."
        )
        assert result.is_eligible is False
        assert result.coverage_type == "none"
        assert "exceeds" in result.notes.lower()
    
    def test_result_with_notes(self):
        """Test result with custom notes."""
        result = EligibilityResult(
            is_eligible=True,
            fpl_percentage=Decimal("150.0000"),
            fpl_guideline=Decimal("25000.00"),
            fap_threshold_applied=Decimal("250.00"),
            coverage_type="partial_charity",
            hospital_id="550e8400-e29b-41d4-a716-446655440000",
            assessment_year=2024,
            notes="Patient qualifies for 50% discount tier."
        )
        assert result.notes == "Patient qualifies for 50% discount tier."


# --- Integration-style Tests ---

class TestCalculationWorkflow:
    """Integration-style tests for complete calculation workflow."""
    
    def test_full_col_adjustment_workflow(self):
        """Test complete workflow: income -> COL adjustment -> FPL %."""
        income = Decimal("60000.00")
        col_factor = Decimal("1.250")
        fpl_guideline = Decimal("30000.00")
        
        adjusted = get_adjusted_income(income, col_factor)
        fpl_pct = calculate_fpl_percentage(adjusted, fpl_guideline)
        
        # 60000 * 1.25 = 75000
        assert adjusted == Decimal("75000.00")
        # 75000 / 30000 * 100 = 250%
        assert fpl_pct == Decimal("250.0000")
    
    def test_boundary_200_percent_fpl(self):
        """Test exact 200% FPL boundary (common charity care threshold)."""
        fpl_guideline = Decimal("25000.00")
        target_income = Decimal("50000.00")  # Exactly 200%
        
        fpl_pct = calculate_fpl_percentage(target_income, fpl_guideline)
        assert fpl_pct == Decimal("200.0000")
    
    def test_large_household_scenario(self):
        """Test scenario with large household (8 people)."""
        # 2024 FPL for 8-person household in contiguous US: ~$62,760
        fpl_guideline = Decimal("62760.00")
        income = Decimal("50000.00")
        
        fpl_pct = calculate_fpl_percentage(income, fpl_guideline)
        # 50000 / 62760 * 100 ≈ 79.67%
        assert fpl_pct < Decimal("100.0000")
        assert fpl_pct == Decimal("79.6686")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
