import pytest
from unittest.mock import MagicMock, AsyncMock
from app.services.providers.registry import ChainedVisionProvider
from app.services.providers.base import SceneAnalysis

@pytest.mark.anyio
async def test_chained_vision_provider_primary_success():
    # Setup mocks
    primary = MagicMock()
    primary.analyze = AsyncMock(return_value=SceneAnalysis(
        subject="dog",
        objects=["dog"],
        composition="centered",
        view="front",
        confidence=0.8,
        raw_description="A dog."
    ))
    
    secondary = MagicMock()
    secondary.analyze = AsyncMock()
    
    provider = ChainedVisionProvider(primary, secondary)
    result = await provider.analyze("dGVzdF9iNjQ=")
    
    assert result.subject == "dog"
    assert result.confidence == 0.8
    primary.analyze.assert_called_once()
    secondary.analyze.assert_not_called()

@pytest.mark.anyio
async def test_chained_vision_provider_fallback_to_secondary():
    primary = MagicMock()
    primary.analyze = AsyncMock(return_value=SceneAnalysis(
        subject="unidentified sketch",
        objects=[],
        composition="unknown",
        view="unknown",
        confidence=0.0,
        raw_description="VLM error: rate limit exceeded"
    ))
    
    secondary = MagicMock()
    secondary.analyze = AsyncMock(return_value=SceneAnalysis(
        subject="cat",
        objects=["cat"],
        composition="centered",
        view="front",
        confidence=0.9,
        raw_description="A cat."
    ))
    
    provider = ChainedVisionProvider(primary, secondary)
    result = await provider.analyze("dGVzdF9iNjQ=")
    
    assert result.subject == "cat"
    assert result.confidence == 0.9
    primary.analyze.assert_called_once()
    secondary.analyze.assert_called_once()
