"""Application Configuration
MachineMind 360 - Explainable AI Factory Health and Maintenance Intelligence
"""

import os
import json
from pathlib import Path
from typing import Annotated, List, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict, NoDecode


class Settings(BaseSettings):
    PROJECT_NAME: str = "MachineMind 360"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    SEED_DEMO_DATA: bool = False

    # Security
    SECRET_KEY: str = "machinemind360-super-secret-key-production-change-in-env"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "sqlite:///./machinemind360.db"

    # CORS
    CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "https://machine360.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = json.loads(v) if v.strip().startswith("[") else v.split(",")
        if not isinstance(v, list):
            raise ValueError("CORS_ORIGINS must be a JSON array or comma-separated origins")
        return [origin.strip().rstrip("/") for origin in v if origin.strip()]

    # Resolve from source, not a platform-specific /var/task path.
    ML_ARTIFACTS_DIR: str = str(Path(__file__).resolve().parents[2] / "artifacts")

    @field_validator("ML_ARTIFACTS_DIR", mode="before")
    @classmethod
    def resolve_artifacts(cls, value):
        path = Path(value).expanduser()
        if not path.is_absolute():
            path = Path(__file__).resolve().parents[2] / path
        return str(path.resolve())

    @model_validator(mode="after")
    def validate_production(self):
        if self.ENVIRONMENT == "production" or os.getenv("VERCEL") == "1":
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError("Production requires a persistent hosted DATABASE_URL; SQLite is not supported")
            if len(self.SECRET_KEY) < 32 or self.SECRET_KEY.startswith("machinemind360-"):
                raise ValueError("Production requires a unique SECRET_KEY of at least 32 characters")
            if self.SEED_DEMO_DATA:
                raise ValueError("Demo seeding is disabled in production")
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
