from fastapi import FastAPI

app = FastAPI(title="Smart AI Painter API")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
