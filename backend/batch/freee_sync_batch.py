import logging
from typing import Optional

from sqlalchemy.orm import Session

from domain.enums import FreeeSyncStatus, InvoiceStatus
from external.freee_client import FreeeClient
from models import AccountTitle
from repositories import account_title_repository as account_title_repo
from repositories import invoice_repository as invoice_repo
from services.freee_sync_domain_service import FreeeSyncDomainService

logger = logging.getLogger(__name__)


class FreeeSyncBatch:

    def __init__(
        self,
        db: Session,
        freee_client: FreeeClient,
        freee_sync_service: FreeeSyncDomainService,
    ):
        self.db = db
        self.freee_client = freee_client
        self.freee_sync_service = freee_sync_service

    def run(self) -> dict:
        """PAID かつ UNSYNCED の請求書を freee に一括連携する"""
        invoices = invoice_repo.find_all(self.db, status=InvoiceStatus.PAID)
        targets = [inv for inv in invoices if self.freee_sync_service.is_sync_target(inv)]

        success = 0
        failed = 0
        errors = []

        for invoice in targets:
            try:
                account_title: Optional[AccountTitle] = None
                if invoice.account_title_id is not None:
                    account_title = account_title_repo.find_by_id(
                        self.db, invoice.account_title_id
                    )

                deal_id = self.freee_client.create_deal(invoice, account_title)
                invoice.freee_deal_id = deal_id
                invoice.freee_sync_status = FreeeSyncStatus.SYNCED.value
                invoice.status = InvoiceStatus.SYNCED_TO_FREEE.value
                invoice_repo.save(self.db, invoice)
                success += 1
                logger.info(
                    "freee連携成功 invoice_id=%s deal_id=%s", invoice.id, deal_id
                )
            except Exception as e:
                failed += 1
                error_msg = f"invoice_id={invoice.id}: {str(e)}"
                errors.append(error_msg)
                logger.error("freee連携失敗 %s", error_msg)

        return {"success": success, "failed": failed, "errors": errors}
