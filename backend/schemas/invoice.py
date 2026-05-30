from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from domain.enums import FreeeSyncStatus, InvoiceStatus


class InvoiceCreate(BaseModel):
    title: str
    amount: int
    due_date: date
    issue_date: date
    account_title_id: Optional[UUID] = None
    template_id: Optional[UUID] = None


class InvoiceUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[int] = None
    due_date: Optional[date] = None
    issue_date: Optional[date] = None
    account_title_id: Optional[UUID] = None


class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus


class InvoiceResponse(BaseModel):
    id: UUID
    title: str
    amount: int
    due_date: date
    issue_date: date
    paid_date: Optional[date] = None
    status: InvoiceStatus
    freee_sync_status: FreeeSyncStatus
    freee_deal_id: Optional[int] = None
    account_title_id: Optional[UUID] = None
    template_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
