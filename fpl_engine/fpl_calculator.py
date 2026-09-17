import logging
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional, List

logger = logging.getLogger("sovereign_shield.fpl_calculator")


def calculate_fpl_percentage(
    annual_income: Decimal,
    household_size: int,
    fpl_guidelines: Dict[int, Decimal]
) -> Decimal:
    """
    Calculates the household's Federal Poverty Level (FPL) percentage.
    Example return: Decimal('2.500') → 250% FPL.
    """

    if household_size <= 0:
        raise ValueError("Household size must be a positive integer.")

    base_fpl_usd = fpl_guidelines.get(household_size)

    # Extrapolate if household size exceeds known FPL table
    if not base_fpl_usd:
        max_size = max(fpl_guidelines.keys())
        max_fpl = fpl_guidelines[max_size]
        extrapolation_step = Decimal("5380.00")  # Standard federal increment
        base_fpl_usd = max_fpl + (Decimal(household_size - max_size) * extrapolation_step)

        logger.warning(
            f"Extrapolated FPL baseline for household size {household_size}: ${base_fpl_usd}"
        )

    fpl_ratio = (annual_income / base_fpl_usd).quantize(
        Decimal("1.000"), rounding=ROUND_HALF_UP
    )

    return fpl_ratio


def evaluate_hospital_assistance(
    fpl_percentage: Decimal,
    fap_thresholds: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates FPL percentage against hospital FAP thresholds.
    Returns a structured payload ready for insertion into charity_care_eligibility.
    """

    sorted_tiers = sorted(
        fap_thresholds,
        key=lambda x: Decimal(str(x.get("fpl_min_multiplier", "0.000")))
    )

    for tier in sorted_tiers:
        fpl_min = Decimal(str(tier["fpl_min_multiplier"]))
        fpl_max = Decimal(str(tier["fpl_max_multiplier"]))

        if fpl_min <= fpl_percentage <= fpl_max:
            return {
                "eligible": True,
                "applied_discount_tier": tier["discount_tier"],
                "applied_discount_percent": Decimal(str(tier.get("discount_percent", "0.00"))),
                "notes": (
                    f"Matched FAP policy bounds: "
                    f"{(fpl_min * 100)}% to {(fpl_max * 100)}% FPL."
                )
            }

    return {
        "eligible": False,
        "applied_discount_tier": "none",
        "applied_discount_percent": Decimal("0.00"),
        "notes": (
            f"Household income baseline ({fpl_percentage * 100}%) exceeds "
            f"hospital FAP policy thresholds."
        )
    }
