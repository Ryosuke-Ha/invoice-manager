from datetime import datetime, timedelta, timezone

from domain.enums import InvoiceStatus
from models import Invoice

JST = timezone(timedelta(hours=9))

_REMINDER_STATUSES = {
    InvoiceStatus.SENT,
    InvoiceStatus.REMINDING,
    InvoiceStatus.OVERDUE,
}


class ReminderDomainService:

    def is_reminder_target(self, invoice: Invoice) -> bool:
        """
        リマインド対象かどうかを判定。

        条件:
          - status が SENT / REMINDING / OVERDUE のいずれか
          - かつ 支払期日3日以内 または 期日超過
        """
        if InvoiceStatus(invoice.status) not in _REMINDER_STATUSES:
            return False
        today = datetime.now(JST).date()
        days_left = (invoice.due_date - today).days
        return days_left <= 3

    def is_overdue_target(self, invoice: Invoice) -> bool:
        """
        期日超過通知対象かどうかを判定。

        条件:
          - status が OVERDUE
        """
        return invoice.status == InvoiceStatus.OVERDUE.value
