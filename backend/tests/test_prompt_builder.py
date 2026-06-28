import pytest
from app.services.providers.base import SceneAnalysis
from app.services.prompt_builder import build_prompt, STYLE_PROMPTS


def test_build_prompt_high_confidence_no_hint():
    scene = SceneAnalysis(
        subject="sleeping animal",
        objects=["cat", "rug"],
        composition="centered",
        view="three-quarter",
        confidence=0.85,
        raw_description="A cat sleeping on a rug."
    )
    result = build_prompt(scene=scene, style="realistic", strength=0.6)
    
    assert "sleeping animal" in result.positive
    assert "with cat, rug" in result.positive
    assert "three-quarter view, dynamic angle" in result.positive
    assert "centered" in result.positive
    assert STYLE_PROMPTS["realistic"] in result.positive


def test_build_prompt_low_confidence_with_hint():
    scene = SceneAnalysis(
        subject="blurry blob",
        objects=[],
        composition="centered",
        view="unknown",
        confidence=0.2,
        raw_description="Unknown shape."
    )
    result = build_prompt(scene=scene, style="watercolor", strength=0.7, user_hint="a cute puppy")
    
    assert "a cute puppy" in result.positive
    assert "blurry blob" not in result.positive
    assert "featuring" not in result.positive
    assert STYLE_PROMPTS["watercolor"] in result.positive


def test_build_prompt_low_confidence_no_hint():
    scene = SceneAnalysis(
        subject="sketch of an object",
        objects=[],
        composition="centered",
        view="unknown",
        confidence=0.2,
        raw_description="Unknown shape."
    )
    # If no hint is provided even at low confidence, fall back to whatever VLM identified
    result = build_prompt(scene=scene, style="anime", strength=0.5, user_hint="")
    
    assert "sketch of an object" in result.positive
    assert STYLE_PROMPTS["anime"] in result.positive


def test_styles_produce_distinct_prompts():
    scene = SceneAnalysis(
        subject="tree",
        objects=["tree"],
        composition="centered",
        view="front view",
        confidence=0.9,
        raw_description="a tree"
    )
    for style, prompt_part in STYLE_PROMPTS.items():
        result = build_prompt(scene=scene, style=style, strength=0.5)
        assert prompt_part in result.positive


def test_strength_affects_guidance_scale():
    scene = SceneAnalysis(
        subject="tree",
        objects=[],
        composition="centered",
        view="front view",
        confidence=0.9,
        raw_description="a tree"
    )
    
    # Low strength
    result_low = build_prompt(scene=scene, style="realistic", strength=0.0)
    assert result_low.guidance_scale == 7.0
    assert result_low.controlnet_conditioning_scale == 0.5

    # High strength
    result_high = build_prompt(scene=scene, style="realistic", strength=1.0)
    assert result_high.guidance_scale == 13.0
    assert result_high.controlnet_conditioning_scale == 1.0
