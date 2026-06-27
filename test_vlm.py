"""
Quick test: verify Gemini VLM is connected and working by calling
POST /api/v1/analyze/ with a small test sketch (a white canvas with a smiley face).

Usage:
    cd smart-ai-painter/backend
    .venv/bin/python ../test_vlm.py
"""
import base64
import io
import json
import socket
import sys

# Force IPv4 — avoids macOS IPv6 drop with Google APIs
_orig = socket.getaddrinfo
socket.getaddrinfo = lambda h, p, f=0, t=0, pr=0, fl=0: _orig(h, p, socket.AF_INET, t, pr, fl)

import requests
from PIL import Image, ImageDraw

# ── Build a tiny test sketch: white background with a circle ──────────────────
img = Image.new("RGB", (512, 512), "white")
draw = ImageDraw.Draw(img)
draw.ellipse([150, 150, 362, 362], outline="black", width=6)        # circle
draw.ellipse([180, 210, 250, 270], outline="black", width=4)        # left eye
draw.ellipse([265, 210, 335, 270], outline="black", width=4)        # right eye
draw.arc([180, 270, 335, 340], start=0, end=180, fill="black", width=5)  # smile

buf = io.BytesIO()
img.save(buf, format="PNG")
sketch_b64 = base64.b64encode(buf.getvalue()).decode()

# ── Call the backend analyze endpoint ────────────────────────────────────────
url = "http://localhost:8000/api/v1/analyze/"
payload = {
    "sketch_base64": f"data:image/png;base64,{sketch_b64}",
    "page_preset": "square",
    "page_width": 512,
    "page_height": 512,
}

print(f"POST {url}")
print("Sketch: circle + two eyes + smile arc (smiley face)\n")

try:
    resp = requests.post(url, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    print("=" * 60)
    print(f"  Provider       : {data['provider']}")
    print(f"  Subject        : {data['subject']}")
    print(f"  Objects        : {', '.join(data['objects']) or '(none)'}")
    print(f"  Composition    : {data['composition']}")
    print(f"  View           : {data['view']}")
    print(f"  Confidence     : {data['confidence']:.0%}")
    print("=" * 60)
    print("\nRaw VLM description:")
    print(json.dumps(json.loads(data["raw_description"]), indent=2))

except requests.exceptions.ConnectionError:
    print("ERROR: Backend is not running. Start it with:")
    print("  cd backend && .venv/bin/python -m uvicorn app.main:app --reload")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    if "resp" in dir():
        print("Response:", resp.status_code, resp.text[:500])
    sys.exit(1)
