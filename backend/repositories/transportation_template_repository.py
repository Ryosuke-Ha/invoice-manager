from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from models import TransportationTemplate


def find_all(db: Session) -> list[TransportationTemplate]:
    return (
        db.query(TransportationTemplate)
        .order_by(TransportationTemplate.day_of_week)
        .all()
    )


def find_by_id(db: Session, id: UUID) -> Optional[TransportationTemplate]:
    return (
        db.query(TransportationTemplate)
        .filter(TransportationTemplate.id == id)
        .first()
    )


def save(
    db: Session, template: TransportationTemplate
) -> TransportationTemplate:
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
