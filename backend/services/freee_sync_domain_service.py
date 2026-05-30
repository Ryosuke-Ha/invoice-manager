from domain.enums import FreeeSyncStatus, InvoiceStatus
from models import Invoice


class FreeeSyncDomainService:

    def is_sync_target(self, invoice: Invoice) -> bool:
        """freee連携対象かどうかを判定（status=PAID かつ freee_sync_status=UNSYNCED）"""
        return (
            invoice.status == InvoiceStatus.PAID.value
            and invoice.freee_sync_status == FreeeSyncStatus.UNSYNCED.value
        )
