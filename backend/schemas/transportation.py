from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, computed_field


class ExpenseCreate(BaseModel):
    expense_date: date
    amount: int
    description: str


class ExpenseUpdate(BaseModel):
    expense_date: Optional[date] = None
    amount: Optional[int] = None
    description: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: UUID
    summary_id: UUID
    expense_date: date
    amount: int
    description: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SummaryResponse(BaseModel):
    id: Optional[UUID] = None
    year: int
    month: int
    is_fixed: bool = False
    expenses: list[ExpenseResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @computed_field  # type: ignore[misc]
    @property
    def total_amount(self) -> int:
        return sum(e.amount for e in self.expenses)

    class Config:
        from_attributes = True
