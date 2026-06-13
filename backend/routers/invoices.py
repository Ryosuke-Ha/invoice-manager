from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from domain.enums import FreeeSyncStatus, InvoiceStatus
from domain.exceptions import (
    FreeeTokenNotFoundError,
    InvalidAmountError,
    InvalidIssueDateError,
    InvalidStatusTransitionError,
)
from domain.value_objects import InvoiceAmount, IssueDate, validate_status_transition
from external.freee_client import FreeeClient
from factories.invoice_factory import create_from_template
from models import Invoice
from repositories import account_title_repository as account_title_repo
from repositories import invoice_repository as repo
from repositories import template_repository as tmpl_repo
from schemas.invoice import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceStatusUpdate,
    InvoiceUpdate,
)
from services.freee_sync_domain_service import FreeeSyncDomainService

JST = timezone(timedelta(hours=9))

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
    if body.template_id is not None:
        template = tmpl_repo.find_by_id(db, body.template_id)
        if template is None:
            raise HTTPException(
                status_code=400, detail="テンプレートが見つかりません"
            )
        now = datetime.now(JST)
        year = body.year if body.year is not None else now.year
        month = body.month if body.month is not None else now.month
        invoice = create_from_template(template, year, month)
        return repo.save(db, invoice)

    # テンプレートなし: 必須フィールドを検証
    if body.title is None or body.amount is None \
            or body.due_date is None or body.issue_date is None:
        raise HTTPException(
            status_code=400,
            detail="template_id を指定しない場合は title・amount・due_date・issue_date が必須です",
        )

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


@router.put("/{id}/status", response_model=InvoiceResponse)
def update_invoice_status(
    id: UUID,
    body: InvoiceStatusUpdate,
    db: Session = Depends(get_db),
):
    invoice = repo.find_by_id(db, id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="請求書が見つかりません")

    current = InvoiceStatus(invoice.status)
    try:
        validate_status_transition(current, body.status)
    except InvalidStatusTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    invoice.status = body.status.value

    if body.status == InvoiceStatus.PAID:
        invoice.paid_date = datetime.now(JST).date()

    return repo.save(db, invoice)


@router.post("/{id}/sync-freee", response_model=InvoiceResponse)
def sync_to_freee(id: UUID, db: Session = Depends(get_db)):
    invoice = repo.find_by_id(db, id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="請求書が見つかりません")

    sync_service = FreeeSyncDomainService()
    if not sync_service.is_sync_target(invoice):
        raise HTTPException(
            status_code=400,
            detail="支払済み・未連携の請求書のみ連携可能です",
        )

    account_title = None
    if invoice.account_title_id is not None:
        account_title = account_title_repo.find_by_id(db, invoice.account_title_id)

    try:
        freee_client = FreeeClient()
        deal_id = freee_client.create_deal(invoice, db, account_title)
    except FreeeTokenNotFoundError:
        raise HTTPException(
            status_code=400,
            detail="freeeが未認証です。GET /api/freee/auth から認証してください。",
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"freee APIエラー: {str(e)}",
        )

    invoice.freee_deal_id = deal_id
    invoice.freee_sync_status = FreeeSyncStatus.SYNCED.value
    return repo.save(db, invoice)
