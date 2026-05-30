import json
from functools import lru_cache

from pydantic import AnyUrl, Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = Field(..., validation_alias="DATABASE_URL")
    n8n_outbound_webhook_url: AnyUrl = Field(..., validation_alias="N8N_OUTBOUND_WEBHOOK_URL")
    n8n_outbound_webhook_token: str = Field(..., validation_alias="N8N_OUTBOUND_WEBHOOK_TOKEN")
    cors_origins_raw: str = Field("http://localhost:3000", validation_alias="CORS_ORIGINS")
    db_min_pool_size: int = Field(1, validation_alias="DB_MIN_POOL_SIZE")
    db_max_pool_size: int = Field(10, validation_alias="DB_MAX_POOL_SIZE")

    @computed_field
    @property
    def cors_origins(self) -> list[str]:
        if self.cors_origins_raw.startswith("["):
            return json.loads(self.cors_origins_raw)
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
