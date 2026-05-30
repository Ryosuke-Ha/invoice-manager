import csv
import io
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from domain.exceptions import TransportationAlreadyFixedError
from factories.transportation_invoice_detail_factory import (
    TransportationInvoiceDetailFactory,
)
from models import MonthlyTransportationSummary, TransportationExpense
from repositories import invoice_repository as invoice_repo
from repositories import transportation_repository as repo
from schemas.invoice import InvoiceResponse
from schemas.transportation import (
    ExpenseCreate,
    ExpenseUpdate,
    SummaryResponse,
)
from services.transportation_merge_domain_service import (
    TransportationMergeDomainService,
)


class MergeToInvoiceRequest(BaseModel):
    account_title_id: Optional[UUID] = None


router = APIRouter(prefix="/api/transportation", tags=["transportation"])


def _summary_response(summary: MonthlyTransportationSummary) -> SummaryResponse:
    return SummaryResponse.model_validate(summary)


@router.get("/export")
def export_csv(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
):
    from sqlalchemy.orm import joinedload
    from models import MonthlyTransportationSummary as Summary

    query = (
        db.query(Summary)
        .options(joinedload(Summary.expenses))
    )
    if year is not None:
        query = query.filter(Summary.year == year)
    if month is not None:
        query = query.filter(Summary.month == month)

    summaries = query.all()

    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(["年月", "日付", "金額", "内容"])
    for summary in summaries:
        ym = f"{summary.year}-{summary.month:02d}"
        for expense in summary.expenses:
            writer.writerow([
                ym,
                expense.expense_date.isoformat(),
                expense.amount,
                expense.description,
            ])

    output.seek(0)

    if year is not None and month is not None:
        filename = f"transportation_{year}_{month:02d}.csv"
    elif year is not None:
        filename = f"transportation_{year}.csv"
    else:
        filename = "transportation.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{year}/{month}", response_model=SummaryResponse)
def get_summary(year: int, month: int, db: Session = Depends(get_db)):
    summary = repo.find_by_year_month(db, year, month)
    if summary is None:
        return SummaryResponse(year=year, month=month)
    return _summary_response(summary)


@router.post("/{year}/{month}/expenses", response_model=SummaryResponse)
def add_expense(
    year: int,
    month: int,
    body: ExpenseCreate,
    db: Session = Depends(get_db),
):
    summary = repo.find_by_year_month(db, year, month)

    if summary is None:
        summary = MonthlyTransportationSummary(year=year, month=month)
        db.add(summary)
        db.flush()

    if summary.is_fixed:
        raise HTTPException(
            status_code=400,
            detail=TransportationAlreadyFixedError(
                "確定済みの交通費集計には追加できません"
            ).args[0],
        )

    expense = TransportationExpense(
        summary_id=summary.id,
        expense_date=body.expense_date,
        amount=body.amount,
        description=body.description,
    )
    db.add(expense)
    db.commit()

    updated = repo.find_by_year_month(db, year, month)
    return _summary_response(updated)


@router.put(
    "/{year}/{month}/expenses/{expense_id}", response_model=SummaryResponse
)
def update_expense(
    year: int,
    month: int,
    expense_id: UUID,
    body: ExpenseUpdate,
    db: Session = Depends(get_db),
):
    summary = repo.find_by_year_month(db, year, month)
    if summary is None:
        raise HTTPException(status_code=404, detail="交通費集計が見つかりません")

    if summary.is_fixed:
        raise HTTPException(
            status_code=400,
            detail="確定済みの交通費集計は編集できません",
        )

    expense = repo.find_expense_by_id(db, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="交通費明細が見つかりません")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)

    db.commit()

    updated = repo.find_by_year_month(db, year, month)
    return _summary_response(updated)


@router.delete("/{year}/{month}/expenses/{expense_id}", status_code=204)
def delete_expense(
    year: int,
    month: int,
    expense_id: UUID,
    db: Session = Depends(get_db),
):
    summary = repo.find_by_year_month(db, year, month)
    if summary is None:
        raise HTTPException(status_code=404, detail="交通費集計が見つかりません")

    if summary.is_fixed:
        raise HTTPException(
            status_code=400,
            detail="確定済みの交通費集計は削除できません",
        )

    expense = repo.find_expense_by_id(db, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="交通費明細が見つかりません")

    db.delete(expense)
    db.commit()


@router.post("/{year}/{month}/fix", response_model=SummaryResponse)
def fix_summary(year: int, month: int, db: Session = Depends(get_db)):
    summary = repo.find_by_year_month(db, year, month)
    if summary is None:
        raise HTTPException(status_code=404, detail="交通費集計が見つかりません")

    if summary.is_fixed:
        raise HTTPException(
            status_code=400,
            detail="既に確定済みの交通費集計です",
        )

    summary.is_fixed = True
    repo.save(db, summary)

    updated = repo.find_by_year_month(db, year, month)
    return _summary_response(updated)


@router.post("/{year}/{month}/merge-to-invoice", response_model=InvoiceResponse)
def merge_to_invoice(
    year: int,
    month: int,
    body: MergeToInvoiceRequest,
    db: Session = Depends(get_db),
):
    summary = repo.find_by_year_month(db, year, month)
    if summary is None:
        raise HTTPException(status_code=404, detail="交通費集計が見つかりません")

    merge_service = TransportationMergeDomainService()
    try:
        merge_service.validate_merge(summary)
    except TransportationAlreadyFixedError as e:
        raise HTTPException(status_code=400, detail=str(e))

    factory = TransportationInvoiceDetailFactory()
    invoice = factory.create_invoice_from_summary(
        summary, account_title_id=body.account_title_id
    )
    return invoice_repo.save(db, invoice)
