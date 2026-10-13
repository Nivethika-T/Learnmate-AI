import pytest
from app.security import verify_password, get_password_hash, create_access_token, decode_access_token

def test_password_hashing():
    raw = "MySecretPassword123!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_creation_and_decoding():
    data = {"sub": "alice_student", "user_id": 42}
    token = create_access_token(data)
    assert token is not None
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == "alice_student"
    assert payload.get("user_id") == 42

def test_invalid_token_decoding():
    payload = decode_access_token("corrupted.invalid.token")
    assert payload is None
