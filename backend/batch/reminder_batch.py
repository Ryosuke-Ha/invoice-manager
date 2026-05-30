import logging

from sqlalchemy.orm import Session

from domain.enums import InvoiceStatus
from external.slack_client import SlackClient
from repositories import invoice_repository as invoice_repo
from services.reminder_domain_service import ReminderDomainService

logger = logging.getLogger(__name__)

_TARGET_STATUSES = [
    InvoiceStatus.SENT,
    InvoiceStatus.REMINDING,
    InvoiceStatus.OVERDUE,
]


class ReminderBatch:

    def __init__(
        self,
        db: Session,
        slack_client: SlackClient,
        reminder_service: ReminderDomainService,
    ):
        self.db = db
        self.slack_client = slack_client
        self.reminder_service = reminder_service

    def run(self) -> dict:
        """
        リマインド対象の請求書を全件取得し Slack に通知する。
        """
        invoices = []
        for status in _TARGET_STATUSES:
            invoices.extend(invoice_repo.find_all(self.db, status=status))

        reminded = 0
        overdue = 0
        errors = []

        for invoice in invoices:
            try:
                if self.reminder_service.is_overdue_target(invoice):
                    self.slack_client.send_overdue(invoice)
                    invoice.status = InvoiceStatus.OVERDUE.value
                    overdue += 1
                elif self.reminder_service.is_reminder_target(invoice):
                    self.slack_client.send_reminder(invoice)
                    invoice.status = InvoiceStatus.REMINDING.value
                    reminded += 1
                else:
                    continue
                invoice_repo.save(self.db, invoice)
            except Exception as e:
                error_msg = f"invoice_id={invoice.id}: {str(e)}"
                errors.append(error_msg)
                logger.error("リマインドバッチ失敗 %s", error_msg)

        logger.info(
            "リマインドバッチ完了 reminded=%d overdue=%d errors=%d",
            reminded,
            overdue,
            len(errors),
        )
        return {"reminded": reminded, "overdue": overdue, "errors": errors}
