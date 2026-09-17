"""
FPL Engine - Core calculator module for charity care eligibility.

Provides:
- FPL percentage calculations
- Cost-of-living adjustments
- Hospital-specific FAP threshold evaluation
- Pydantic models for validation
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# --- Data Models ---

class FamilyIncome(BaseModel):
    """Represents family income and household information."""
    household_size: int = Field(gt=0, description="Number of people in the household")
    annual_gross_income: Decimal = Field(ge=0, description="Annual gross income in USD")
    state: str = Field(min_length=2, max_length=2, description="Two-letter state code")
    cost_of_living_adjustment_factor: Decimal = Field(
        default=Decimal("1.000"),
        ge=Decimal("0.500"),
        le=Decimal("2.000"),
        description="COL adjustment multiplier (0.5-2.0)"
    )

    @field_validator("state")
    @classmethod
    def validate_state(cls, v: str) -> str:
        return v.upper()


class EligibilityResult(BaseModel):
    """Represents the result of a charity care eligibility assessment."""
    is_eligible: bool
    fpl_percentage: Decimal
    fpl_guideline: Decimal
    fap_threshold_applied: Decimal
    coverage_type: str
    hospital_id: str
    assessment_year: int
    notes: Optional[str] = None


# --- FPL Calculator Functions ---

def calculate_fpl_percentage(
    annual_income: Decimal,
    fpl_guideline: Decimal,
    round_to: int = 4
) -> Decimal:
    """
    Calculate the percentage of Federal Poverty Level.
    
    Formula: (Annual Income / FPL Guideline) * 100
    
    Args:
        annual_income: Total annual gross income
        fpl_guideline: Federal poverty guideline for household size and year
        round_to: Decimal precision for the result
    
    Returns:
        FPL percentage as a Decimal
    
    Raises:
        ValueError: If FPL guideline is zero or negative
    """
    if fpl_guideline <= 0:
        raise ValueError("FPL guideline must be greater than zero.")
    
    percentage = (annual_income / fpl_guideline) * Decimal("100.0")
    quantizer = Decimal("1." + "0" * round_to)
    return percentage.quantize(quantizer, rounding=ROUND_HALF_UP)


def get_adjusted_income(
    annual_income: Decimal,
    col_adjustment_factor: Decimal
) -> Decimal:
    """
    Apply cost-of-living adjustment to income if applicable.
    
    Args:
        annual_income: Original annual income
        col_adjustment_factor: COL adjustment multiplier
    
    Returns:
        Adjusted income for evaluation (rounded to cents)
    """
    adjusted = annual_income * col_adjustment_factor
    return adjusted.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# --- Database Interaction Functions ---

async def get_fpl_guideline(
    session: AsyncSession,
    year: int,
    household_size: int
) -> Optional[Decimal]:
    """
    Fetch the FPL guideline for a given year and household size.
    
    Args:
        session: Active database session
        year: Assessment year
        household_size: Number of people in household
    
    Returns:
        FPL guideline as Decimal, or None if not found
    """
    # Import schema dynamically to avoid circular imports
    from sqlalchemy import MetaData
    meta = MetaData()
    # Table will be reflected or use explicit definition
    # For now, assume table exists with standard columns
    federal_poverty_guidelines = None
    
    try:
        # Try to import if available
        from fpl_engine.schema import federal_poverty_guidelines as fpg_table
    except ImportError:
        # Reflect table
        meta.reflect(bind=session.bind.sync_engine)
        fpg_table = meta.tables.get('federal_poverty_guidelines')
    
    if fpg_table is None:
        raise RuntimeError("federal_poverty_guidelines table not found")
    
    query = select(fpg_table.c.poverty_guideline).where(
        fpg_table.c.year == year,
        fpg_table.c.household_size == household_size
    )
    result = await session.execute(query)
    guideline = result.scalar_one_or_none()
    return Decimal(str(guideline)) if guideline is not None else None


async def get_hospital_fap_thresholds(
    session: AsyncSession,
    hospital_id: str,
    year: int,
    household_size: int
) -> List[Dict[str, Any]]:
    """
    Fetch all applicable FAP thresholds for a hospital, year, and household size.
    
    Args:
        session: Active database session
        hospital_id: UUID of the hospital
        year: Assessment year
        household_size: Number of people in household
    
    Returns:
        List of threshold dictionaries with fpl_percentage, coverage_type, notes
    """
    from sqlalchemy import MetaData
    meta = MetaData()
    
    try:
        from fpl_engine.schema import hospital_fap_thresholds as fap_table
    except ImportError:
        meta.reflect(bind=session.bind.sync_engine)
        fap_table = meta.tables.get('hospital_fap_thresholds')
    
    if fap_table is None:
        raise RuntimeError("hospital_fap_thresholds table not found")
    
    query = select(
        fap_table.c.fpl_percentage,
        fap_table.c.coverage_type,
        fap_table.c.notes
    ).where(
        fap_table.c.hospital_id == hospital_id,
        fap_table.c.year == year,
        fap_table.c.household_size == household_size
    ).order_by(fap_table.c.fpl_percentage.desc())
    
    result = await session.execute(query)
    rows = result.mappings().all()
    return [dict(row) for row in rows]


# --- Eligibility Evaluation ---

async def evaluate_hospital_assistance(
    session: AsyncSession,
    family: FamilyIncome,
    hospital_id: str,
    assessment_year: Optional[int] = None
) -> EligibilityResult:
    """
    Evaluate a family's eligibility for hospital charity care.
    
    Args:
        session: Active database session
        family: Family income and household details
        hospital_id: UUID of the hospital
        assessment_year: Year to evaluate against (defaults to current year)
    
    Returns:
        EligibilityResult with full assessment details
    
    Raises:
        ValueError: If FPL guideline or FAP thresholds not found
    """
    if assessment_year is None:
        assessment_year = datetime.utcnow().year
    
    # Get FPL guideline
    fpl_guideline = await get_fpl_guideline(session, assessment_year, family.household_size)
    if fpl_guideline is None:
        raise ValueError(
            f"No FPL guideline found for year {assessment_year} "
            f"and household size {family.household_size}"
        )
    
    # Apply COL adjustment
    adjusted_income = get_adjusted_income(
        family.annual_gross_income,
        family.cost_of_living_adjustment_factor
    )
    
    # Calculate FPL percentage
    fpl_percentage = calculate_fpl_percentage(adjusted_income, fpl_guideline)
    
    # Get hospital-specific thresholds
    thresholds = await get_hospital_fap_thresholds(
        session,
        hospital_id,
        assessment_year,
        family.household_size
    )
    
    if not thresholds:
        raise ValueError(
            f"No FAP thresholds found for hospital {hospital_id} in {assessment_year} "
            f"for household size {family.household_size}"
        )
    
    # Find the best matching threshold (highest threshold the family qualifies for)
    eligible_threshold = None
    for threshold in thresholds:
        threshold_pct = Decimal(str(threshold["fpl_percentage"]))
        if fpl_percentage <= threshold_pct:
            eligible_threshold = threshold
            break  # Since sorted desc, first match is the most generous
    
    is_eligible = eligible_threshold is not None
    
    if not is_eligible:
        return EligibilityResult(
            is_eligible=False,
            fpl_percentage=fpl_percentage,
            fpl_guideline=fpl_guideline,
            fap_threshold_applied=Decimal(str(thresholds[-1]["fpl_percentage"])),
            coverage_type="none",
            hospital_id=hospital_id,
            assessment_year=assessment_year,
            notes="Income exceeds all available FAP thresholds."
        )
    
    return EligibilityResult(
        is_eligible=True,
        fpl_percentage=fpl_percentage,
        fpl_guideline=fpl_guideline,
        fap_threshold_applied=Decimal(str(eligible_threshold["fpl_percentage"])),
        coverage_type=eligible_threshold["coverage_type"],
        hospital_id=hospital_id,
        assessment_year=assessment_year,
        notes=eligible_threshold.get("notes")
    )
