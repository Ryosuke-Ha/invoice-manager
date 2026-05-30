import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from models import Invoice

logger = logging.getLogger(__name__)

JST = timezone(timedelta(hours=9))


class SlackClient:

    def __init__(self):
        self.webhook_url = os.environ["SLACK_WEBHOOK_URL"]

    def send_message(self, text: str, blocks: Optional[list] = None) -> None:
        """Slack Incoming Webhook でメッセージを送信"""
        payload: dict = {"text": text}
        if blocks is not None:
            payload["blocks"] = blocks
        masked_url = self.webhook_url[:40] + "***"
        try:
            res = httpx.post(self.webhook_url, json=payload)
            res.raise_for_status()
        except Exception as e:
            logger.error(
                "Slack送信エラー webhook_url=%s error_message=%s",
                masked_url,
                str(e),
            )
            raise

    def send_reminder(self, invoice: Invoice) -> None:
        """支払期日リマインド通知を送信"""
        today = datetime.now(JST).date()
        days_left = (invoice.due_date - today).days
        text = (
            "【支払期日リマインド】\n"
            f"請求書: {invoice.title}\n"
            f"金額: {invoice.amount:,}円\n"
            f"支払期日: {invoice.due_date}（あと{days_left}日）\n"
            f"ステータス: {invoice.status}"
        )
        self.send_message(text)

    def send_overdue(self, invoice: Invoice) -> None:
        """期日超過通知を送信"""
        today = datetime.now(JST).date()
        days_overdue = (today - invoice.due_date).days
        text = (
            "【⚠️ 支払期日超過】\n"
            f"請求書: {invoice.title}\n"
            f"金額: {invoice.amount:,}円\n"
            f"支払期日: {invoice.due_date} （{days_overdue}日超過）\n"
            f"ステータス: {invoice.status}"
        )
        self.send_message(text)
