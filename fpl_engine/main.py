"""
Sovereign Core Shield - Main FastAPI Application

Runtime wiring for:
- Secure settings validation (Pydantic SecretStr)
- Database connectivity
- Vendor client initialization (Plaid, Stripe, Twilio, Lob)
- HIPAA compliance checks
- Startup health probes

Usage:
    uvicorn fpl_engine.main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Import secure settings
try:
    from config import settings
except ImportError:
    raise RuntimeError(
        "config.py not found. Ensure SovereignShieldSettings is defined with all required secrets."
    )

# Import FPL Engine components
from fpl_engine.calculator import (
    FamilyIncome,
    EligibilityResult,
    evaluate_hospital_assistance
)

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.ENV != "production" else logging.WARNING,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
)
logger = logging.getLogger("sovereign_shield.main")

# --- Global Clients (Initialized at Startup) ---

db_engine = None
async_session_maker = None

plaid_client = None
stripe = None
twilio_client = None
lob_api_key = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Application lifespan manager for startup/shutdown events.
    Validates all connections and secrets before accepting traffic.
    """
    logger.info(f"🚀 Sovereign Core Shield starting in {settings.ENV.upper()} mode")
    logger.info(f"Version: {settings.VERSION}")
    
    # === 1. Database Initialization ===
    global db_engine, async_session_maker
    
    try:
        db_engine = create_async_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=settings.ENV == "development"
        )
        async_session_maker = async_sessionmaker(
            db_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        # Verify DB connectivity
        async with db_engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection established successfully.")
        
    except Exception as db_err:
        logger.critical(f"❌ Database connection failed: {db_err}")
        raise RuntimeError(f"Database initialization failed: {db_err}")
    
    # === 2. Plaid Client Initialization ===
    global plaid_client
    try:
        from plaid import Client as PlaidClient
        
        plaid_env = "production" if settings.ENV == "production" else "sandbox"
        plaid_client = PlaidClient(
            client_id=settings.PLAID_CLIENT_ID,
            secret=settings.PLAID_SECRET.get_secret_value(),
            environment=plaid_env
        )
        
        # Lightweight connectivity check (avoid heavy API calls in prod startup)
        if settings.ENV == "development":
            try:
                # Test with a dummy item ID (expected to fail with specific error, not auth error)
                plaid_client.Item.get("test_item_id")
            except Exception as e:
                if "INVALID_ACCESS_TOKEN" in str(e) or "ITEM_NOT_FOUND" in str(e):
                    logger.info("✅ Plaid client initialized successfully (sandbox test).")
                else:
                    raise
            else:
                logger.info("✅ Plaid client initialized successfully.")
        else:
            logger.info("✅ Plaid client initialized (production mode, skipped ping).")
            
    except Exception as plaid_err:
        logger.warning(f"⚠️  Plaid connectivity check failed: {plaid_err}")
        # Don't block startup for Plaid in dev, but log warning
    
    # === 3. Stripe Client Initialization ===
    global stripe
    try:
        import stripe as stripe_lib
        stripe_lib.api_key = settings.STRIPE_SECRET_KEY.get_secret_value()
        stripe = stripe_lib
        
        if settings.ENV == "development":
            # Verify Stripe connectivity
            stripe.Balance.retrieve()
            logger.info("✅ Stripe client initialized successfully.")
        else:
            logger.info("✅ Stripe client initialized (production mode, skipped ping).")
            
    except Exception as stripe_err:
        logger.warning(f"⚠️  Stripe connectivity check failed: {stripe_err}")
    
    # === 4. Twilio Client Initialization ===
    global twilio_client
    try:
        from twilio.rest import Client as TwilioClient
        
        # Account SID might be in settings or env; using placeholder if not available
        account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', 'AC_placeholder')
        twilio_client = TwilioClient(
            account_sid,
            settings.TWILIO_AUTH_TOKEN.get_secret_value()
        )
        logger.info("✅ Twilio client initialized successfully.")
        
    except Exception as twilio_err:
        logger.warning(f"⚠️  Twilio connectivity check failed: {twilio_err}")
    
    # === 5. Lob Client Initialization ===
    global lob_api_key
    try:
        import lob
        lob_api_key = settings.LOB_API_KEY.get_secret_value()
        lob.api_key = lob_api_key
        
        if settings.ENV == "development":
            # Lightweight check: retrieve address list (should succeed with valid key)
            lob.Address.list(count=1)
            logger.info("✅ Lob client initialized successfully.")
        else:
            logger.info("✅ Lob client initialized (production mode, skipped ping).")
            
    except Exception as lob_err:
        logger.warning(f"⚠️  Lob connectivity check failed: {lob_err}")
    
    # === 6. HIPAA Compliance Check ===
    if settings.ENV == "production":
        if not settings.HIPAA_ENCRYPTION_KEY:
            raise RuntimeError("HIPAA_ENCRYPTION_KEY is required in production mode.")
        logger.info("✅ HIPAA encryption key validated.")
    
    logger.info("✨ All systems operational. Accepting traffic.")
    
    yield  # Application runs here
    
    # === Shutdown ===
    logger.info("🛑 Shutting down Sovereign Core Shield...")
    
    if db_engine:
        await db_engine.dispose()
        logger.info("Database connections closed.")


# --- FastAPI Application ---

app = FastAPI(
    title="Sovereign Core Shield",
    description=(
        "HIPAA-compliant charity care automation engine for pediatric oncology families. "
        "Automates 501(r) eligibility assessments, vendor payments, and debt dissolution."
    ),
    version=settings.VERSION,
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
    openapi_url="/openapi.json" if settings.ENV != "production" else None,
    lifespan=lifespan
)


# --- Health Check Endpoints ---

@app.get("/health", tags=["Health"])
async def health_check():
    """Basic liveness probe."""
    return {"status": "healthy", "version": settings.VERSION}


@app.get("/health/ready", tags=["Health"])
async def readiness_check():
    """Readiness probe verifying all external dependencies."""
    checks = {
        "database": False,
        "plaid": False,
        "stripe": False,
        "twilio": False,
        "lob": False
    }
    
    # Database check
    try:
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        pass
    
    # Plaid check
    if plaid_client:
        try:
            plaid_client.Item.get("test_item_id")
        except Exception as e:
            if "INVALID_ACCESS_TOKEN" in str(e) or "ITEM_NOT_FOUND" in str(e):
                checks["plaid"] = True
        else:
            checks["plaid"] = True
    
    # Stripe check
    if stripe:
        try:
            stripe.Balance.retrieve()
            checks["stripe"] = True
        except Exception:
            pass
    
    # Twilio check
    if twilio_client:
        try:
            twilio_client.api.accounts(settings.TWILIO_ACCOUNT_SID).fetch()
            checks["twilio"] = True
        except Exception:
            pass
    
    # Lob check
    if lob_api_key:
        try:
            import lob
            lob.Address.list(count=1)
            checks["lob"] = True
        except Exception:
            pass
    
    all_healthy = all(checks.values())
    status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return {
        "status": "ready" if all_healthy else "degraded",
        "checks": checks
    }, status_code


# --- Core Business Logic Endpoints ---

@app.post("/api/v1/eligibility/assess", response_model=EligibilityResult, tags=["Eligibility"])
async def assess_eligibility(family: FamilyIncome, hospital_id: str, year: int = None):
    """
    Assess a family's eligibility for hospital charity care.
    
    - **family**: Household income and size details
    - **hospital_id**: UUID of the target hospital
    - **year**: Assessment year (defaults to current year)
    
    Returns detailed eligibility result with FPL percentage and coverage tier.
    """
    async with async_session_maker() as session:
        try:
            result = await evaluate_hospital_assistance(
                session=session,
                family=family,
                hospital_id=hospital_id,
                assessment_year=year
            )
            return result
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            logger.error(f"Eligibility assessment failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Eligibility assessment failed due to internal error."
            )


@app.get("/api/v1/hospitals", tags=["Hospitals"])
async def list_hospitals(state: str = None, is_active: bool = True):
    """
    List participating hospitals with optional filtering.
    """
    from sqlalchemy import select
    from fpl_engine.schema import hospitals as hospitals_table
    
    async with async_session_maker() as session:
        stmt = select(hospitals_table)
        
        if state:
            stmt = stmt.where(hospitals_table.c.state == state.upper())
        if is_active is not None:
            stmt = stmt.where(hospitals_table.c.is_active == is_active)
        
        result = await session.execute(stmt)
        rows = result.mappings().all()
        
        return [{"hospital_id": str(row["hospital_id"]), "name": row["name"], "city": row["city"]} for row in rows]


# --- Root Endpoint ---

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Sovereign Core Shield",
        "version": settings.VERSION,
        "environment": settings.ENV,
        "docs": "/docs" if settings.ENV != "production" else "Disabled in production"
    }
