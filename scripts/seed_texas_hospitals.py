"""
Seed script for Texas Hospital FAP Thresholds.

Populates the database with:
1. Major East Texas Hospitals (Children's Health Dallas, UT Health, CHRISTUS, Baylor Scott & White).
2. Realistic FAP thresholds based on typical 501(r) policies (e.g., 200% - 400% FPL).
3. Multi-year data (2024, 2025) for forward compatibility.

Usage:
    python scripts/seed_texas_hospitals.py
"""

import asyncio
import logging
import sys
from decimal import Decimal
from typing import List, Dict
from uuid import UUID
from pathlib import Path

# Add root to path for imports
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy import select, insert
    # Try to import settings; fallback to env var if config module missing
    try:
        from config import settings
        DATABASE_URL = settings.DATABASE_URL
    except ImportError:
        import os
        DATABASE_URL = os.getenv("DATABASE_URL")
        if not DATABASE_URL:
            raise ValueError("DATABASE_URL not found in settings or environment.")
except ImportError as e:
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.error(f"Import failed: {e}")
    raise

# Import schema tables
# Adjust import based on actual structure
try:
    from fpl_engine.schema import hospitals, hospital_fap_thresholds
except ImportError:
    # Fallback if schema is defined directly in SQL or different module
    from sqlalchemy import MetaData, Table
    
    metadata = MetaData()
    
    # Define tables manually if ORM models not available
    hospitals = Table('hospitals', metadata,
        autoload_with=None  # Will be populated by engine reflection if needed, 
                            # but better to use explicit definition
    )
    # For this script, we assume the user has run schema.sql first
    # and we will reflect or define columns explicitly below in the functions
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("seed_texas_hospitals")

# --- Configuration Data ---

TEXAS_HOSPITALS = [
    {
        "name": "Children's Health Dallas",
        "system_name": "Children's Health",
        "address_line1": "2350 N Stemmons Fwy",
        "city": "Dallas",
        "state": "TX",
        "zip_code": "75235",
        "phone_number": "214-456-7000",
        "fap_policy_url": "https://www.childrens.com/financial-assistance",
        "fap_notes": "Tiered assistance up to 400% FPL. Full charity <200%."
    },
    {
        "name": "UT Health East Texas - Tyler",
        "system_name": "UT Health Science Center",
        "address_line1": "1000 S Beckham St",
        "city": "Tyler",
        "state": "TX",
        "zip_code": "75701",
        "phone_number": "903-596-7000",
        "fap_policy_url": "https://www.uthealthetx.org/financial-assistance",
        "fap_notes": "Sliding scale discount up to 300% FPL."
    },
    {
        "name": "CHRISTUS Trinity Mother Frances",
        "system_name": "CHRISTUS Health",
        "address_line1": "1000 S Beckham St",
        "city": "Tyler",
        "state": "TX",
        "zip_code": "75701",
        "phone_number": "903-596-7000",
        "fap_policy_url": "https://www.christushealth.org/financial-assistance",
        "fap_notes": "Full charity up to 250% FPL, partial up to 400%."
    },
    {
        "name": "Baylor Scott & White - Temple",
        "system_name": "Baylor Scott & White Health",
        "address_line1": "2401 S 31st St",
        "city": "Temple",
        "state": "TX",
        "zip_code": "76508",
        "phone_number": "254-724-2111",
        "fap_policy_url": "https://www.bswhealth.com/financial-assistance",
        "fap_notes": "Comprehensive FAP aligned with Texas Hospital Association guidelines."
    }
]

# Typical FAP Tiers (Percentage of FPL)
# Format: (FPL %, Coverage Type, Notes)
FAP_TIERS = [
    (Decimal("200.00"), "full_charity", "100% debt forgiveness"),
    (Decimal("250.00"), "partial_charity", "75% debt forgiveness"),
    (Decimal("300.00"), "partial_charity", "50% debt forgiveness"),
    (Decimal("400.00"), "discounted_care", "25% debt forgiveness / Sliding scale"),
]

async def seed_hospitals(session: AsyncSession, engine) -> Dict[str, UUID]:
    """Insert hospitals and return a mapping of name -> UUID."""
    hospital_map = {}
    
    # Reflect table if ORM model not available
    from sqlalchemy import MetaData
    meta = MetaData()
    meta.reflect(bind=engine.sync_engine)
    hosp_table = meta.tables['hospitals']
    
    for h_data in TEXAS_HOSPITALS:
        # Check if exists
        stmt = select(hosp_table.c.hospital_id).where(hosp_table.c.name == h_data["name"])
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            logger.info(f"Hospital '{h_data['name']}' already exists ({existing}).")
            hospital_map[h_data["name"]] = existing
            continue
        
        # Insert new
        insert_stmt = insert(hosp_table).values(**h_data).returning(hosp_table.c.hospital_id)
        result = await session.execute(insert_stmt)
        new_id = result.scalar_one()
        hospital_map[h_data["name"]] = new_id
        logger.info(f"Inserted hospital: {h_data['name']} ({new_id})")
    
    await session.commit()
    return hospital_map

async def seed_fap_thresholds(session: AsyncSession, hospital_map: Dict[str, UUID], year: int, engine):
    """Insert FAP thresholds for all hospitals."""
    # Reflect table
    from sqlalchemy import MetaData
    meta = MetaData()
    meta.reflect(bind=engine.sync_engine)
    fap_table = meta.tables['hospital_fap_thresholds']
    
    # We need household sizes 1-10 for robust testing
    household_sizes = list(range(1, 11))
    
    count = 0
    for h_name, h_id in hospital_map.items():
        for size in household_sizes:
            for fpl_pct, cov_type, notes in FAP_TIERS:
                # Check existence
                stmt = select(fap_table.c.threshold_id).where(
                    fap_table.c.hospital_id == h_id,
                    fap_table.c.year == year,
                    fap_table.c.household_size == size,
                    fap_table.c.fpl_percentage == fpl_pct
                )
                result = await session.execute(stmt)
                if result.scalar_one_or_none():
                    continue
                
                # Insert
                data = {
                    "hospital_id": h_id,
                    "year": year,
                    "household_size": size,
                    "fpl_percentage": fpl_pct,
                    "coverage_type": cov_type,
                    "notes": f"{notes} (Seeded for {year})"
                }
                await session.execute(insert(fap_table).values(**data))
                count += 1
    
    await session.commit()
    logger.info(f"Inserted {count} FAP threshold records for year {year}.")

async def main():
    logger.info("Starting Texas Hospital FAP Seed...")
    
    if not DATABASE_URL:
        logger.error("DATABASE_URL not found. Aborting.")
        return

    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    async with AsyncSession(engine) as session:
        try:
            # 1. Seed Hospitals
            hospital_map = await seed_hospitals(session, engine)
            
            # 2. Seed FAP Thresholds for 2024 and 2025
            for year in [2024, 2025]:
                await seed_fap_thresholds(session, hospital_map, year, engine)
            
            logger.info("✅ Texas Hospital FAP Seed completed successfully.")
            print("\n--- Seeded Hospitals ---")
            for name, uid in hospital_map.items():
                print(f"- {name}: {uid}")
                
        except Exception as e:
            logger.error(f"Seed failed: {e}", exc_info=True)
            await session.rollback()
            raise
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
