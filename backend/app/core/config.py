from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Smart AI Painter API"
    api_version: str = "1.0.0"
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # AI generation settings
    ai_mode: Literal["mock", "huggingface"] = "mock"
    hf_api_token: str = ""
    hf_model_id: str = "stabilityai/stable-diffusion-xl-base-1.0"
    hf_timeout_seconds: int = 120

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
