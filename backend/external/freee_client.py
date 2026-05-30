import json
import logging
import os
import time
from pathlib import Path
from typing import Optional
from urllib.parse import urlencode

import httpx

from models import AccountTitle, Invoice

logger = logging.getLogger(__name__)

TOKENS_PATH = Path(__file__).parent.parent / ".tokens" / "freee_token.json"


class FreeeClient:

    BASE_URL = "https://api.freee.co.jp"
    AUTH_URL = "https://accounts.freee.co.jp/public_api/token"

    def __init__(self):
        self.client_id = os.environ.get("FREEE_CLIENT_ID", "")
        self.client_secret = os.environ.get("FREEE_CLIENT_SECRET", "")
        self.redirect_uri = os.environ.get("FREEE_REDIRECT_URI", "")
        self.company_id = os.environ.get("FREEE_COMPANY_ID", "")

    def get_auth_url(self) -> str:
        """OAuth2認証URLを生成"""
        params = urlencode({
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "read write",
        })
        return (
            "https://accounts.freee.co.jp/public_api/authorize"
            f"?{params}"
        )

    def get_token(self, code: str) -> dict:
        """認証コードからアクセストークンを取得して保存"""
        try:
            res = httpx.post(
                self.AUTH_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                    "code": code,
                },
            )
            res.raise_for_status()
            token = res.json()
            self._save_token(token)
            return token
        except Exception as e:
            logger.error(
                "freee token取得エラー endpoint=get_token error_message=%s", str(e)
            )
            raise

    def refresh_token(self) -> dict:
        """アクセストークンをリフレッシュして保存"""
        try:
            saved = self._load_token()
            res = httpx.post(
                self.AUTH_URL,
                data={
                    "grant_type": "refresh_token",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": saved["refresh_token"],
                },
            )
            res.raise_for_status()
            token = res.json()
            self._save_token(token)
            return token
        except Exception as e:
            logger.error(
                "freee tokenリフレッシュエラー endpoint=refresh_token error_message=%s",
                str(e),
            )
            raise

    def get_access_token(self) -> str:
        """有効なアクセストークンを返す（期限切れの場合は自動リフレッシュ）"""
        token = self._load_token()
        # 60秒のバッファを設けてリフレッシュ
        if time.time() >= token.get("expires_at", 0) - 60:
            token = self.refresh_token()
        return token["access_token"]

    def create_deal(
        self,
        invoice: Invoice,
        account_title: Optional[AccountTitle] = None,
    ) -> int:
        """請求書をfreeeに登録してfreee_deal_idを返す"""
        try:
            access_token = self.get_access_token()
            detail = {
                "amount": invoice.amount,
                "description": invoice.title,
            }
            if account_title is not None:
                detail["account_item_id"] = account_title.freee_account_item_id
                detail["tax_code"] = account_title.freee_tax_code

            payload = {
                "issue_date": invoice.issue_date.strftime("%Y-%m-%d"),
                "due_date": invoice.due_date.strftime("%Y-%m-%d"),
                "type": "income",
                "company_id": int(self.company_id),
                "details": [detail],
            }
            res = httpx.post(
                f"{self.BASE_URL}/api/1/deals",
                headers={"Authorization": f"Bearer {access_token}"},
                json=payload,
            )
            res.raise_for_status()
            return res.json()["deal"]["id"]
        except Exception as e:
            logger.error(
                "freee deal登録エラー endpoint=create_deal error_message=%s", str(e)
            )
            raise

    # ---------- private ----------

    def _save_token(self, token: dict) -> None:
        TOKENS_PATH.parent.mkdir(parents=True, exist_ok=True)
        token_data = dict(token)
        if "expires_in" in token_data and "expires_at" not in token_data:
            token_data["expires_at"] = time.time() + token_data["expires_in"]
        TOKENS_PATH.write_text(json.dumps(token_data))

    def _load_token(self) -> dict:
        if not TOKENS_PATH.exists():
            raise FileNotFoundError(
                "freeeトークンファイルが見つかりません。"
                "GET /api/freee/auth から認証してください。"
            )
        return json.loads(TOKENS_PATH.read_text())
