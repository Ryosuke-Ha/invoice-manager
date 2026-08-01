import os
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from batch.freee_sync_batch import FreeeSyncBatch
from batch.reminder_batch import ReminderBatch
from database import get_db
from external.freee_client import FreeeClient
from external.slack_client import SlackClient
from rate_limiter import limiter
from services.freee_sync_domain_service import FreeeSyncDomainService
from services.reminder_domain_service import ReminderDomainService

router = APIRouter(prefix="/api/batch", tags=["batch"])


@router.post("/freee-sync")
@limiter.limit("5/minute")
def run_freee_sync(
    request: Request,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """freee連携バッチを実行する（BATCH_SECRET_KEY 認証必須）"""
    secret_key = os.environ.get("BATCH_SECRET_KEY", "")
    expected = f"Bearer {secret_key}"
    if not secret_key or authorization != expected:
        raise HTTPException(status_code=401, detail="認証に失敗しました")

    batch = FreeeSyncBatch(
        db=db,
        freee_client=FreeeClient(),
        freee_sync_service=FreeeSyncDomainService(),
    )
    return batch.run()


@router.post("/reminder")
@limiter.limit("5/minute")
def run_reminder(
    request: Request,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """リマインドバッチを実行する（BATCH_SECRET_KEY 認証必須）"""
    secret_key = os.environ.get("BATCH_SECRET_KEY", "")
    expected = f"Bearer {secret_key}"
    if not secret_key or authorization != expected:
        raise HTTPException(status_code=401, detail="認証に失敗しました")

    batch = ReminderBatch(
        db=db,
        slack_client=SlackClient(),
        reminder_service=ReminderDomainService(),
    )
    return batch.run()
