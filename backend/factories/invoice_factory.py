import calendar
from datetime import date

from domain.enums import FreeeSyncStatus, InvoiceStatus
from models import Invoice, InvoiceTemplate


def create_from_template(
    template: InvoiceTemplate,
    year: int,
    month: int,
) -> Invoice:
    issue_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    due_date = date(year, month, last_day)

    return Invoice(
        title=template.title,
        amount=template.amount,
        issue_date=issue_date,
        due_date=due_date,
        status=InvoiceStatus.DRAFT.value,
        freee_sync_status=FreeeSyncStatus.UNSYNCED.value,
        account_title_id=template.account_title_id,
        template_id=template.id,
    )
