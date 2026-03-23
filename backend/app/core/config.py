from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "Smart AI Painter API"
