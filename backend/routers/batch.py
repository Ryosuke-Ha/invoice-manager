import os
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from batch.freee_sync_batch import FreeeSyncBatch
from database import get_db
from external.freee_client import FreeeClient
from services.freee_sync_domain_service import FreeeSyncDomainService

router = APIRouter(prefix="/api/batch", tags=["batch"])


@router.post("/freee-sync")
def run_freee_sync(
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
