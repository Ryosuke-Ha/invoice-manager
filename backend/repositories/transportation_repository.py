from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from domain.exceptions import TransportationAlreadyFixedError
from models import MonthlyTransportationSummary, TransportationExpense


def find_by_year_month(
    db: Session, year: int, month: int
):
    return (
        db.query(MonthlyTransportationSummary)
        .options(
            joinedload(MonthlyTransportationSummary.expenses).order_by(
                TransportationExpense.expense_date.asc()
            )
        )
        .filter(
            MonthlyTransportationSummary.year == year,
            MonthlyTransportationSummary.month == month,
        )
        .first()
    )


def find_expense_by_id(db: Session, expense_id: UUID):
    return (
        db.query(TransportationExpense)
        .filter(TransportationExpense.id == expense_id)
        .first()
    )


def save(
    db: Session, summary: MonthlyTransportationSummary
) -> MonthlyTransportationSummary:
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


def remove(db: Session, id: UUID) -> None:
    summary = (
        db.query(MonthlyTransportationSummary)
        .filter(MonthlyTransportationSummary.id == id)
        .first()
    )
    if summary is None:
        return
    if summary.is_fixed:
        raise TransportationAlreadyFixedError(
            "確定済みの交通費集計は削除できません"
        )
    db.delete(summary)
    db.commit()
