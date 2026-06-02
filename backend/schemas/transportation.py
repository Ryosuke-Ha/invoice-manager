from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, computed_field, field_validator

_DAY_OF_WEEK_LABELS = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "日曜日"]


class TransportationTemplateCreate(BaseModel):
    day_of_week: int
    amount: int
    description: str

    @field_validator("day_of_week")
    @classmethod
    def validate_day_of_week(cls, v: int) -> int:
        if v < 0 or v > 6:
            raise ValueError("day_of_week must be between 0 and 6")
        return v


class TransportationTemplateUpdate(BaseModel):
    day_of_week: Optional[int] = None
    amount: Optional[int] = None
    description: Optional[str] = None

    @field_validator("day_of_week")
    @classmethod
    def validate_day_of_week(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 6):
            raise ValueError("day_of_week must be between 0 and 6")
        return v


class TransportationTemplateResponse(BaseModel):
    id: UUID
    day_of_week: int
    amount: int
    description: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @computed_field  # type: ignore[misc]
    @property
    def day_of_week_label(self) -> str:
        return _DAY_OF_WEEK_LABELS[self.day_of_week]

    class Config:
        from_attributes = True


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
