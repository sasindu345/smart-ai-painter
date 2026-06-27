import json
from typing import Annotated, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Smart AI Painter API"
    api_version: str = "1.0.0"
    secret_key: str = ""
    allowed_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    # AI generation settings
    ai_mode: Literal["mock", "local_diffusers", "replicate"] = "mock"
    local_diffusers_url: str = ""
    replicate_api_token: str = ""
    replicate_model_id: str = "jagilley/controlnet-scribble"

    # Vision (VLM) settings
    vlm_provider: Literal["mock", "gemini", "grok", "groq"] = "mock"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    grok_api_key: str = ""
    grok_model: str = "grok-2-vision-1212"
    groq_api_key: str = ""
    groq_model: str = "llama-3.2-11b-vision-preview"

    # Confidence Threshold
    vlm_confidence_threshold: float = 0.5

    # Database settings
    database_url: str = ""

    # Cloudinary settings
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_storage_bucket: str = "generated-images"

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            if stripped.startswith("["):
                return json.loads(stripped)
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return value

    @field_validator("supabase_storage_bucket", mode="before")
    @classmethod
    def normalize_storage_bucket(cls, value: str) -> str:
        if value is None:
            return "generated-images"
        cleaned = str(value).strip()
        if not cleaned or cleaned == "-":
            return "generated-images"
        return cleaned

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
