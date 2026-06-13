import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from domain.exceptions import FreeeTokenNotFoundError
from models import AccountTitle, FreeeToken, Invoice

logger = logging.getLogger(__name__)

JST = timezone(timedelta(hours=9))


class FreeeClient:

    BASE_URL = "https://api.freee.co.jp"
    TOKEN_URL = "https://accounts.secure.freee.co.jp/public_api/token"

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
            "https://accounts.secure.freee.co.jp/public_api/authorize"
            f"?{params}"
        )

    def get_token(self, code: str, db: Session) -> dict:
        """認証コードからアクセストークンを取得してDBに保存"""
        try:
            res = httpx.post(
                self.TOKEN_URL,
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
            self._save_token(token, db)
            return token
        except Exception as e:
            logger.error(
                "freee token取得エラー endpoint=get_token error_message=%s", str(e)
            )
            raise

    def refresh_token(self, db: Session) -> dict:
        """DBからリフレッシュトークンを取得してアクセストークンを更新"""
        try:
            record = db.query(FreeeToken).first()
            if record is None:
                raise FreeeTokenNotFoundError(
                    "freeeトークンが見つかりません。"
                    "GET /api/freee/auth から認証してください。"
                )
            res = httpx.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": record.refresh_token,
                },
            )
            res.raise_for_status()
            token = res.json()
            self._save_token(token, db)
            return token
        except FreeeTokenNotFoundError:
            raise
        except Exception as e:
            logger.error(
                "freee tokenリフレッシュエラー endpoint=refresh_token error_message=%s",
                str(e),
            )
            raise

    def get_access_token(self, db: Session) -> str:
        """DBから有効なアクセストークンを返す（期限切れの場合は自動リフレッシュ）"""
        record = db.query(FreeeToken).first()
        if record is None:
            raise FreeeTokenNotFoundError(
                "freeeトークンが見つかりません。"
                "GET /api/freee/auth から認証してください。"
            )
        now = datetime.now(JST)
        # 60秒のバッファを設けてリフレッシュ
        if now >= record.expires_at - timedelta(seconds=60):
            token = self.refresh_token(db)
            return token["access_token"]
        return record.access_token

    def create_deal(
        self,
        invoice: Invoice,
        db: Session,
        account_title: Optional[AccountTitle] = None,
    ) -> int:
        """請求書をfreeeに登録してfreee_deal_idを返す"""
        try:
            access_token = self.get_access_token(db)
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
        except FreeeTokenNotFoundError:
            raise
        except Exception as e:
            logger.error(
                "freee deal登録エラー endpoint=create_deal error_message=%s", str(e)
            )
            raise

    # ---------- private ----------

    def _save_token(self, token: dict, db: Session) -> None:
        expires_at = datetime.now(JST) + timedelta(
            seconds=token.get("expires_in", 3600)
        )
        record = db.query(FreeeToken).first()
        if record is None:
            record = FreeeToken(
                access_token=token["access_token"],
                refresh_token=token["refresh_token"],
                expires_at=expires_at,
            )
            db.add(record)
        else:
            record.access_token = token["access_token"]
            record.refresh_token = token["refresh_token"]
            record.expires_at = expires_at
        db.commit()
