import calendar
from datetime import date
from typing import Optional
from uuid import UUID

from domain.enums import FreeeSyncStatus, InvoiceStatus
from models import Invoice, MonthlyTransportationSummary


def last_day_of_month(year: int, month: int) -> date:
    """指定年月の末日を返す"""
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, last_day)


class TransportationInvoiceDetailFactory:

    def create_invoice_from_summary(
        self,
        summary: MonthlyTransportationSummary,
        account_title_id: Optional[UUID] = None,
    ) -> Invoice:
        """確定済み月次交通費集計から請求書を生成"""
        total = sum(e.amount for e in summary.expenses)
        return Invoice(
            title=f"{summary.year}年{summary.month}月 交通費",
            amount=total,
            issue_date=date.today(),
            due_date=last_day_of_month(summary.year, summary.month),
            status=InvoiceStatus.SENT.value,
            freee_sync_status=FreeeSyncStatus.UNSYNCED.value,
            account_title_id=account_title_id,
        )
