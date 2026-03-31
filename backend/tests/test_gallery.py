import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

os.environ["AI_MODE"] = "mock"

from app.main import app
from app.api import deps

client = TestClient(app)

MOCK_USER = {
    "sub": "user-123-abc",
    "email": "test@example.com",
    "aud": "authenticated",
}


def override_get_current_user():
    return MOCK_USER


# Override auth dependency for tests
app.dependency_overrides[deps.get_current_user] = override_get_current_user

MOCK_GALLERY_DATA = [
    {
        "id": "gen-1",
        "prompt": "a sunset landscape",
        "style": "watercolor",
        "image_url": "https://example.com/img1.png",
        "created_at": "2026-03-20T10:00:00+00:00",
    },
    {
        "id": "gen-2",
        "prompt": "a cat portrait",
        "style": "oil",
        "image_url": "https://example.com/img2.png",
        "created_at": "2026-03-19T10:00:00+00:00",
    },
]


class TestGalleryEndpoints:
    @patch("app.api.v1.routes.gallery._get_supabase")
    def test_get_gallery_success(self, mock_supabase):
        """GET /api/v1/gallery/ returns paginated user generations."""
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        # Mock count query
        count_result = MagicMock()
        count_result.count = 2
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = count_result

        # Mock data query — need separate chain for order/range
        data_result = MagicMock()
        data_result.data = MOCK_GALLERY_DATA
        chain = mock_client.table.return_value.select.return_value
        chain.eq.return_value.order.return_value.range.return_value.execute.return_value = data_result

        resp = client.get("/api/v1/gallery/")
        assert resp.status_code == 200

        body = resp.json()
        assert body["total"] == 2
        assert body["page"] == 1
        assert body["has_more"] is False
        assert len(body["items"]) == 2
        assert body["items"][0]["id"] == "gen-1"
        assert body["items"][0]["image_url"] == "https://example.com/img1.png"

    @patch("app.api.v1.routes.gallery._get_supabase")
    def test_get_gallery_pagination(self, mock_supabase):
        """GET /api/v1/gallery/?page=1&limit=1 shows has_more=true when more exist."""
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        count_result = MagicMock()
        count_result.count = 2
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = count_result

        data_result = MagicMock()
        data_result.data = [MOCK_GALLERY_DATA[0]]
        chain = mock_client.table.return_value.select.return_value
        chain.eq.return_value.order.return_value.range.return_value.execute.return_value = data_result

        resp = client.get("/api/v1/gallery/?page=1&limit=1")
        assert resp.status_code == 200
        body = resp.json()
        assert body["has_more"] is True
        assert len(body["items"]) == 1

    @patch("app.api.v1.routes.gallery.delete_generation_file")
    @patch("app.api.v1.routes.gallery._get_supabase")
    def test_delete_generation_success(self, mock_supabase, mock_delete_file):
        """DELETE /api/v1/gallery/{id} removes the record and file."""
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        # Mock the ownership check
        select_result = MagicMock()
        select_result.data = [
            {"id": "gen-1", "image_url": "https://example.com/img1.png"}
        ]
        (
            mock_client.table.return_value
            .select.return_value
            .eq.return_value
            .eq.return_value
            .execute.return_value
        ) = select_result

        # Mock the delete
        mock_client.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()

        resp = client.delete("/api/v1/gallery/gen-1")
        assert resp.status_code == 204

        mock_delete_file.assert_called_once_with("https://example.com/img1.png")

    @patch("app.api.v1.routes.gallery._get_supabase")
    def test_delete_generation_not_found(self, mock_supabase):
        """DELETE /api/v1/gallery/{id} returns 404 when not found or not owned."""
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client

        select_result = MagicMock()
        select_result.data = []
        (
            mock_client.table.return_value
            .select.return_value
            .eq.return_value
            .eq.return_value
            .execute.return_value
        ) = select_result

        resp = client.delete("/api/v1/gallery/nonexistent-id")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_gallery_requires_auth(self):
        """Gallery endpoints require authentication."""
        # Remove the auth override temporarily
        del app.dependency_overrides[deps.get_current_user]

        # Without a bearer token, should get 401/403
        resp = client.get("/api/v1/gallery/")
        assert resp.status_code in (401, 403)

        # Restore override for other tests
        app.dependency_overrides[deps.get_current_user] = override_get_current_user


class TestAuthEndpoint:
    def test_get_me(self):
        """GET /api/v1/auth/me returns current user info."""
        # Ensure override is set
        app.dependency_overrides[deps.get_current_user] = override_get_current_user
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 200
        body = resp.json()
        assert body["id"] == "user-123-abc"
        assert body["email"] == "test@example.com"
