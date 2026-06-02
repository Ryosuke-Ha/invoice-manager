import uuid

from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey,
    Integer, String, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class AccountTitle(Base):
    __tablename__ = "account_titles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    account_type = Column(String(20), nullable=False)
    freee_company_id = Column(Integer, nullable=False)
    freee_account_item_id = Column(Integer, nullable=False)
    freee_tax_code = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class InvoiceTemplate(Base):
    __tablename__ = "invoice_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    amount = Column(Integer, nullable=False)
    account_title_id = Column(
        UUID(as_uuid=True), ForeignKey("account_titles.id"), nullable=True
    )
    auto_generate = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    amount = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False)
    issue_date = Column(Date, nullable=False)
    paid_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=False, default="draft")
    freee_sync_status = Column(String(50), nullable=False, default="unsynced")
    freee_deal_id = Column(Integer, nullable=True)
    account_title_id = Column(
        UUID(as_uuid=True), ForeignKey("account_titles.id"), nullable=True
    )
    template_id = Column(
        UUID(as_uuid=True), ForeignKey("invoice_templates.id"), nullable=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class MonthlyTransportationSummary(Base):
    __tablename__ = "monthly_transportation_summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    is_fixed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (UniqueConstraint("year", "month", name="uq_year_month"),)

    expenses = relationship(
        "TransportationExpense", back_populates="summary", lazy="select"
    )


class TransportationTemplate(Base):
    __tablename__ = "transportation_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    day_of_week = Column(Integer, nullable=False)  # 0=月 1=火 2=水 3=木 4=金 5=土 6=日
    amount = Column(Integer, nullable=False)
    description = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class TransportationExpense(Base):
    __tablename__ = "transportation_expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    summary_id = Column(
        UUID(as_uuid=True),
        ForeignKey("monthly_transportation_summaries.id"),
        nullable=False,
    )
    expense_date = Column(Date, nullable=False)
    amount = Column(Integer, nullable=False)
    description = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    summary = relationship(
        "MonthlyTransportationSummary", back_populates="expenses"
    )
