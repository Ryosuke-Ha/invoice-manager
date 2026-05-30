from uuid import UUID

from sqlalchemy.orm import Session

from models import InvoiceTemplate


def find_all(db: Session) -> list:
    return db.query(InvoiceTemplate).all()


def find_by_id(db: Session, id: UUID):
    return db.query(InvoiceTemplate).filter(InvoiceTemplate.id == id).first()


def save(db: Session, template: InvoiceTemplate) -> InvoiceTemplate:
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def remove(db: Session, id: UUID) -> None:
    template = find_by_id(db, id)
    if template is None:
        return
    db.delete(template)
    db.commit()
