from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class TemplateCreate(BaseModel):
    title: str
    amount: int
    account_title_id: Optional[UUID] = None
    auto_generate: bool = False


class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[int] = None
    account_title_id: Optional[UUID] = None
    auto_generate: Optional[bool] = None


class TemplateResponse(BaseModel):
    id: UUID
    title: str
    amount: int
    account_title_id: Optional[UUID] = None
    auto_generate: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
