import calendar

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


EXPENSE = {"expense_date": "2026-05-10", "amount": 500, "description": "渋谷→新宿"}
EXPENSE2 = {"expense_date": "2026-05-15", "amount": 1200, "description": "新宿→池袋"}


def add_expense(client, payload=None):
    return client.post("/api/transportation/2026/5/expenses", json=payload or EXPENSE)


def fix_month(client):
    return client.post("/api/transportation/2026/5/fix")


# ---------- 確定 ----------

class TestFixSummary:
    def test_fix_success(self, client):
        add_expense(client)
        res = fix_month(client)
        assert res.status_code == 200
        body = res.json()
        assert body["is_fixed"] is True
        assert body["year"] == 2026
        assert body["month"] == 5

    def test_fix_already_fixed_fails(self, client):
        add_expense(client)
        fix_month(client)
        res = fix_month(client)
        assert res.status_code == 400

    def test_fix_not_found_fails(self, client):
        res = client.post("/api/transportation/2026/5/fix")
        assert res.status_code == 404

    def test_fix_returns_expenses(self, client):
        add_expense(client)
        res = fix_month(client)
        assert len(res.json()["expenses"]) == 1


# ---------- 請求書反映 ----------

class TestMergeToInvoice:
    def test_merge_success(self, client):
        add_expense(client)
        fix_month(client)
        res = client.post(
            "/api/transportation/2026/5/merge-to-invoice",
            json={"account_title_id": None},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["title"] == "2026年5月 交通費"
        assert body["status"] == "sent"
        assert body["freee_sync_status"] == "unsynced"

    def test_merge_not_fixed_fails(self, client):
        add_expense(client)
        res = client.post(
            "/api/transportation/2026/5/merge-to-invoice",
            json={},
        )
        assert res.status_code == 400

    def test_merge_not_found_fails(self, client):
        res = client.post(
            "/api/transportation/2026/5/merge-to-invoice",
            json={},
        )
        assert res.status_code == 404

    def test_merge_amount_equals_total(self, client):
        add_expense(client, EXPENSE)
        add_expense(client, EXPENSE2)
        fix_month(client)
        res = client.post(
            "/api/transportation/2026/5/merge-to-invoice",
            json={},
        )
        assert res.status_code == 200
        assert res.json()["amount"] == 500 + 1200

    def test_merge_due_date_is_last_day(self, client):
        add_expense(client)
        fix_month(client)
        res = client.post(
            "/api/transportation/2026/5/merge-to-invoice",
            json={},
        )
        assert res.status_code == 200
        last_day = calendar.monthrange(2026, 5)[1]
        assert res.json()["due_date"] == f"2026-05-{last_day:02d}"

    def test_merge_zero_expenses_amount_zero(self, client, db):
        """交通費0件の場合 amount=0"""
        from models import MonthlyTransportationSummary
        summary = MonthlyTransportationSummary(year=2026, month=5, is_fixed=True)
        db.add(summary)
        db.commit()

        res = client.post(
            "/api/transportation/2026/5/merge-to-invoice",
            json={},
        )
        assert res.status_code == 200
        assert res.json()["amount"] == 0
