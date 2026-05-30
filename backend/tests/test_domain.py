from datetime import timedelta, datetime, timezone
import pytest

from domain.exceptions import InvalidAmountError, InvalidIssueDateError
from domain.value_objects import InvoiceAmount, DueDate, IssueDate

JST = timezone(timedelta(hours=9))


def today():
    return datetime.now(JST).date()


# ---------- InvoiceAmount ----------

class TestInvoiceAmount:
    def test_valid_amount(self):
        amt = InvoiceAmount(100000)
        assert amt.value == 100000

    def test_amount_of_one(self):
        amt = InvoiceAmount(1)
        assert amt.value == 1

    def test_zero_raises(self):
        with pytest.raises(InvalidAmountError):
            InvoiceAmount(0)

    def test_negative_raises(self):
        with pytest.raises(InvalidAmountError):
            InvoiceAmount(-1)


# ---------- DueDate ----------

class TestDueDate:
    def test_due_today_is_within_reminder_range(self):
        d = DueDate(today())
        assert d.is_within_reminder_range() is True
        assert d.is_overdue() is False

    def test_due_in_3_days_is_within_reminder_range(self):
        d = DueDate(today() + timedelta(days=3))
        assert d.is_within_reminder_range() is True
        assert d.is_overdue() is False

    def test_due_in_4_days_is_not_within_reminder_range(self):
        d = DueDate(today() + timedelta(days=4))
        assert d.is_within_reminder_range() is False
        assert d.is_overdue() is False

    def test_overdue_yesterday(self):
        d = DueDate(today() - timedelta(days=1))
        assert d.is_overdue() is True
        assert d.is_within_reminder_range() is False

    def test_overdue_far_past(self):
        d = DueDate(today() - timedelta(days=30))
        assert d.is_overdue() is True
        assert d.is_within_reminder_range() is False


# ---------- IssueDate ----------

class TestIssueDate:
    def test_today_is_valid(self):
        d = IssueDate(today())
        assert d.value == today()

    def test_past_date_is_valid(self):
        d = IssueDate(today() - timedelta(days=1))
        assert d.value == today() - timedelta(days=1)

    def test_future_date_raises(self):
        with pytest.raises(InvalidIssueDateError):
            IssueDate(today() + timedelta(days=1))
