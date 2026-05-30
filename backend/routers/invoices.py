from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from domain.enums import InvoiceStatus
from domain.exceptions import (
    InvalidAmountError,
    InvalidIssueDateError,
    InvalidStatusTransitionError,
)
from domain.value_objects import InvoiceAmount, IssueDate
from models import Invoice
from repositories import invoice_repository as repo
from schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceUpdate

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.get("", response_model=list[InvoiceResponse])
def list_invoices(
    status: Optional[InvoiceStatus] = None,
    db: Session = Depends(get_db),
):
    return repo.find_all(db, status=status)


@router.get("/{id}", response_model=InvoiceResponse)
def get_invoice(id: UUID, db: Session = Depends(get_db)):
    invoice = repo.find_by_id(db, id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="請求書が見つかりません")
    return invoice


@router.post("", response_model=InvoiceResponse, status_code=201)
def create_invoice(body: InvoiceCreate, db: Session = Depends(get_db)):
    try:
        InvoiceAmount(body.amount)
    except InvalidAmountError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        IssueDate(body.issue_date)
    except InvalidIssueDateError as e:
        raise HTTPException(status_code=400, detail=str(e))

    invoice = Invoice(
        title=body.title,
        amount=body.amount,
        due_date=body.due_date,
        issue_date=body.issue_date,
        account_title_id=body.account_title_id,
        template_id=body.template_id,
    )
    return repo.save(db, invoice)


@router.put("/{id}", response_model=InvoiceResponse)
def update_invoice(
    id: UUID,
    body: InvoiceUpdate,
    db: Session = Depends(get_db),
):
    invoice = repo.find_by_id(db, id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="請求書が見つかりません")

    if invoice.status != InvoiceStatus.DRAFT.value:
        raise HTTPException(
            status_code=400,
            detail="Draft以外の請求書は編集できません",
        )

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(invoice, field, value)

    return repo.save(db, invoice)


@router.delete("/{id}", status_code=204)
def delete_invoice(id: UUID, db: Session = Depends(get_db)):
    invoice = repo.find_by_id(db, id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="請求書が見つかりません")

    try:
        repo.remove(db, id)
    except InvalidStatusTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))
