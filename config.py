"""
Secure Configuration Settings for Sovereign Core Shield.

Uses Pydantic Settings with SecretStr for HIPAA-compliant secret management.
All sensitive values (API keys, DB URLs, encryption keys) are stored as secrets.

Environment Variables Required:
    - DATABASE_URL
    - PLAID_CLIENT_ID
    - PLAID_SECRET
    - STRIPE_SECRET_KEY
    - TWILIO_ACCOUNT_SID
    - TWILIO_AUTH_TOKEN
    - LOB_API_KEY
    - HIPAA_ENCRYPTION_KEY (production only)
    - ENV (development|staging|production)
"""

from functools import lru_cache
from typing import Optional

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class SovereignShieldSettings(BaseSettings):
    """
    Secure settings container for the Sovereign Core Shield application.
    
    All sensitive fields use SecretStr to prevent accidental logging/exposure.
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # === Application Settings ===
    ENV: str = Field(default="development", pattern="^(development|staging|production)$")
    VERSION: str = "1.0.0"
    APP_NAME: str = "Sovereign Core Shield"
    
    # === Database ===
    DATABASE_URL: SecretStr = Field(..., description="PostgreSQL connection string")
    
    # === Plaid (Bank Account Verification) ===
    PLAID_CLIENT_ID: str = Field(..., min_length=1)
    PLAID_SECRET: SecretStr = Field(..., description="Plaid API secret")
    
    # === Stripe (Payment Processing) ===
    STRIPE_SECRET_KEY: SecretStr = Field(..., description="Stripe secret key (sk_live_... or sk_test_...)")
    STRIPE_WEBHOOK_SECRET: Optional[SecretStr] = Field(None, description="Stripe webhook signing secret")
    
    # === Twilio (SMS/Voice Communications) ===
    TWILIO_ACCOUNT_SID: str = Field(default="AC_placeholder", min_length=1)
    TWILIO_AUTH_TOKEN: SecretStr = Field(..., description="Twilio auth token")
    TWILIO_PHONE_NUMBER: Optional[str] = Field(None, description="Twilio phone number for SMS")
    
    # === Lob (Direct Mail Automation) ===
    LOB_API_KEY: SecretStr = Field(..., description="Lob API key for mailing charity care applications")
    
    # === HIPAA Compliance ===
    HIPAA_ENCRYPTION_KEY: Optional[SecretStr] = Field(
        None, 
        description="AES-256 encryption key for PHI field-level encryption (required in production)"
    )
    
    # === AWS / Cloud (Optional) ===
    AWS_REGION: Optional[str] = Field("us-east-1", description="AWS region for S3/Secrets Manager")
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[SecretStr] = None
    
    # === Logging ===
    LOG_LEVEL: str = Field(default="INFO", pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
    
    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: SecretStr) -> SecretStr:
        """Ensure DATABASE_URL starts with postgresql+asyncpg://"""
        url_str = v.get_secret_value()
        if not url_str.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "DATABASE_URL must use asyncpg driver. Format: "
                "postgresql+asyncpg://user:pass@host:port/dbname"
            )
        return v
    
    @field_validator("HIPAA_ENCRYPTION_KEY")
    @classmethod
    def validate_hipaa_key(cls, v: Optional[SecretStr], info) -> Optional[SecretStr]:
        """Require HIPAA_ENCRYPTION_KEY in production mode."""
        # Access environment via info.data or re-check
        # Note: validation order matters; ENV should be validated first
        env = info.data.get("ENV", "development")
        if env == "production" and v is None:
            raise ValueError("HIPAA_ENCRYPTION_KEY is required in production mode")
        
        if v is not None:
            key_str = v.get_secret_value()
            if len(key_str) < 32:
                raise ValueError("HIPAA_ENCRYPTION_KEY must be at least 32 characters (AES-256)")
        
        return v
    
    def get_database_url(self) -> str:
        """Safely retrieve database URL string."""
        return self.DATABASE_URL.get_secret_value()
    
    def get_plaid_secret(self) -> str:
        """Safely retrieve Plaid secret."""
        return self.PLAID_SECRET.get_secret_value()
    
    def get_stripe_key(self) -> str:
        """Safely retrieve Stripe secret key."""
        return self.STRIPE_SECRET_KEY.get_secret_value()
    
    def get_twilio_token(self) -> str:
        """Safely retrieve Twilio auth token."""
        return self.TWILIO_AUTH_TOKEN.get_secret_value()
    
    def get_lob_key(self) -> str:
        """Safely retrieve Lob API key."""
        return self.LOB_API_KEY.get_secret_value()
    
    def get_hipaa_encryption_key(self) -> Optional[str]:
        """Safely retrieve HIPAA encryption key if set."""
        if self.HIPAA_ENCRYPTION_KEY:
            return self.HIPAA_ENCRYPTION_KEY.get_secret_value()
        return None


@lru_cache()
def get_settings() -> SovereignShieldSettings:
    """
    Cached settings singleton.
    
    Pydantic Settings automatically loads from:
    1. Environment variables
    2. .env file
    3. Default values
    
    Returns:
        SovereignShieldSettings instance
    """
    return SovereignShieldSettings()


# Global settings instance for easy import
settings = get_settings()


if __name__ == "__main__":
    # Test settings loading
    try:
        print(f"Environment: {settings.ENV}")
        print(f"Database URL configured: {'Yes' else 'No'}")
        print(f"Plaid configured: {'Yes' if settings.PLAID_CLIENT_ID else 'No'}")
        print(f"Stripe configured: {'Yes' else 'No'}")
        print(f"HIPAA Key configured: {'Yes' if settings.HIPAA_ENCRYPTION_KEY else 'No'}")
    except Exception as e:
        print(f"Settings validation failed: {e}")
