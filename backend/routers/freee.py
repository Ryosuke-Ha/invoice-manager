import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from external.freee_client import FreeeClient

router = APIRouter(prefix="/api/freee", tags=["freee"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


@router.get("/auth")
def get_auth_url():
    """freee OAuth2認証URLを返す"""
    client = FreeeClient()
    return {"auth_url": client.get_auth_url()}


@router.get("/callback")
def freee_callback(code: str):
    """freee OAuth2コールバック: トークンを取得してフロントへリダイレクト"""
    client = FreeeClient()
    try:
        client.get_token(code)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"freeeトークン取得に失敗しました: {str(e)}",
        )
    return RedirectResponse(url=FRONTEND_URL)
