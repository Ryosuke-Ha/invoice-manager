from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class AccountTitleCreate(BaseModel):
    name: str
    account_type: str
    freee_company_id: int
    freee_account_item_id: int
    freee_tax_code: int


class AccountTitleUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    freee_company_id: Optional[int] = None
    freee_account_item_id: Optional[int] = None
    freee_tax_code: Optional[int] = None


class AccountTitleResponse(BaseModel):
    id: UUID
    name: str
    account_type: str
    freee_company_id: int
    freee_account_item_id: int
    freee_tax_code: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
