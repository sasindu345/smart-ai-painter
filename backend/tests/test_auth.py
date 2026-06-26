from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.services.user_service import hash_password, verify_password
from app.core.security import create_access_token, verify_jwt_token

client = TestClient(app)


def test_password_hashing():
    password = "secret_password"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_jwt_generation_verification():
    payload = {"sub": "user-123-abc", "email": "test@example.com"}
    token = create_access_token(payload)
    decoded = verify_jwt_token(token)
    assert decoded["sub"] == payload["sub"]
    assert decoded["email"] == payload["email"]


@patch("app.services.user_service.get_user_by_email")
@patch("app.services.user_service.create_user")
def test_signup_endpoint(mock_create_user, mock_get_user):
    mock_get_user.return_value = None
    mock_create_user.return_value = {
        "id": "mock-uuid-123",
        "email": "signup@example.com"
    }

    resp = client.post(
        "/api/v1/auth/signup",
        json={"email": "signup@example.com", "password": "securepassword"}
    )
    assert resp.status_code == 201
    body = resp.json()
    assert "access_token" in body
    assert body["user"]["email"] == "signup@example.com"


@patch("app.services.user_service.get_user_by_email")
def test_login_endpoint(mock_get_user):
    hashed_pwd = hash_password("securepassword")
    mock_get_user.return_value = {
        "id": "mock-uuid-123",
        "email": "login@example.com",
        "hashed_password": hashed_pwd
    }

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "securepassword"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["user"]["email"] == "login@example.com"


@patch("app.services.user_service.get_user_by_email")
def test_login_invalid_password(mock_get_user):
    hashed_pwd = hash_password("securepassword")
    mock_get_user.return_value = {
        "id": "mock-uuid-123",
        "email": "login@example.com",
        "hashed_password": hashed_pwd
    }

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "wrongpassword"}
    )
    assert resp.status_code == 401
