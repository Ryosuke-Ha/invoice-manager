from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from domain.enums import InvoiceStatus
from domain.exceptions import InvalidStatusTransitionError
from models import Invoice

JST = timezone(timedelta(hours=9))

_PAID_STATUSES = {
    InvoiceStatus.PAID,
    InvoiceStatus.COMPLETED,
    InvoiceStatus.SYNCED_TO_FREEE,
}


def find_by_id(db: Session, id: UUID):
    return db.query(Invoice).filter(Invoice.id == id).first()


def find_all(db: Session, status: InvoiceStatus = None) -> list:
    query = db.query(Invoice)
    if status is not None:
        query = query.filter(Invoice.status == status.value)
    return query.all()


def find_due_within_days(db: Session, days: int) -> list:
    today = datetime.now(JST).date()
    deadline = today + timedelta(days=days)
    paid_values = [s.value for s in _PAID_STATUSES]
    return (
        db.query(Invoice)
        .filter(
            Invoice.due_date >= today,
            Invoice.due_date <= deadline,
            Invoice.status.notin_(paid_values),
        )
        .all()
    )


def save(db: Session, invoice: Invoice) -> Invoice:
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


def remove(db: Session, id: UUID) -> None:
    invoice = find_by_id(db, id)
    if invoice is None:
        return
    if invoice.status != InvoiceStatus.DRAFT.value:
        raise InvalidStatusTransitionError(
            f"Draft以外の請求書は削除できません: status={invoice.status}"
        )
    db.delete(invoice)
    db.commit()
