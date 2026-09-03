"""Supabase JWT verification + RLS claim building."""

from __future__ import annotations

import uuid

import pytest

from app.core.errors import UnauthorizedError
from app.core.security import build_rls_claims, decode_supabase_jwt
from tests.conftest import make_token


def test_decodes_valid_token_and_extracts_claims() -> None:
    uid = uuid.uuid4()
    spa = uuid.uuid4()
    token = make_token(uid, spa_ids=[spa], memberships={spa: "manager"}, email="a@b.co")

    claims = decode_supabase_jwt(token)

    assert claims.user_id == uid
    assert claims.email == "a@b.co"
    assert claims.spa_ids == [spa]
    assert claims.role_for(spa) == "manager"
    assert claims.role_for(uuid.uuid4()) is None


def test_rejects_expired_token() -> None:
    token = make_token(uuid.uuid4(), expired=True)
    with pytest.raises(UnauthorizedError) as exc:
        decode_supabase_jwt(token)
    assert exc.value.code == "token_expired"


def test_rejects_bad_signature() -> None:
    token = make_token(uuid.uuid4(), secret="the-wrong-secret")
    with pytest.raises(UnauthorizedError) as exc:
        decode_supabase_jwt(token)
    assert exc.value.code == "token_invalid"


def test_rejects_wrong_audience() -> None:
    import jwt as pyjwt

    bad = pyjwt.encode(
        {"sub": str(uuid.uuid4()), "aud": "anon", "exp": 9999999999},
        "test-secret",
        algorithm="HS256",
    )
    with pytest.raises(UnauthorizedError):
        decode_supabase_jwt(bad)


def test_build_rls_claims_shape() -> None:
    uid, spa = uuid.uuid4(), uuid.uuid4()
    claims = decode_supabase_jwt(
        make_token(uid, spa_ids=[spa], memberships={spa: "owner"})
    )
    payload = build_rls_claims(claims, spa)
    assert payload["sub"] == str(uid)
    assert payload["role"] == "authenticated"
    assert payload["app_metadata"]["spa_ids"] == [str(spa)]
    assert payload["app_metadata"]["memberships"] == {str(spa): "owner"}
    assert payload["active_spa_id"] == str(spa)
