import uuid

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


EXPENSE = {
    "expense_date": "2026-05-10",
    "amount": 500,
    "description": "渋谷→新宿",
}


def add_expense(client, year=2026, month=5, payload=None):
    return client.post(
        f"/api/transportation/{year}/{month}/expenses",
        json=payload or EXPENSE,
    )


def fix_summary(db, year, month):
    from models import MonthlyTransportationSummary
    db.query(MonthlyTransportationSummary).filter(
        MonthlyTransportationSummary.year == year,
        MonthlyTransportationSummary.month == month,
    ).update({"is_fixed": True})
    db.commit()


# ---------- 月次集計取得 ----------

class TestGetSummary:
    def test_not_exists_returns_empty(self, client):
        res = client.get("/api/transportation/2026/5")
        assert res.status_code == 200
        body = res.json()
        assert body["year"] == 2026
        assert body["month"] == 5
        assert body["expenses"] == []
        assert body["total_amount"] == 0
        assert body["is_fixed"] is False

    def test_exists_returns_summary(self, client):
        add_expense(client)
        res = client.get("/api/transportation/2026/5")
        assert res.status_code == 200
        body = res.json()
        assert len(body["expenses"]) == 1
        assert body["total_amount"] == 500


# ---------- 交通費追加 ----------

class TestAddExpense:
    def test_add_creates_summary_if_not_exists(self, client):
        res = add_expense(client)
        assert res.status_code == 200
        body = res.json()
        assert body["year"] == 2026
        assert body["month"] == 5
        assert len(body["expenses"]) == 1
        assert body["expenses"][0]["amount"] == 500

    def test_add_multiple_expenses(self, client):
        add_expense(client)
        add_expense(client, payload={
            "expense_date": "2026-05-15",
            "amount": 300,
            "description": "新宿→池袋",
        })
        res = client.get("/api/transportation/2026/5")
        assert len(res.json()["expenses"]) == 2

    def test_add_to_fixed_fails(self, client, db):
        add_expense(client)
        fix_summary(db, 2026, 5)
        res = add_expense(client)
        assert res.status_code == 400

    def test_total_amount_calculation(self, client):
        add_expense(client, payload={
            "expense_date": "2026-05-10",
            "amount": 500,
            "description": "A",
        })
        add_expense(client, payload={
            "expense_date": "2026-05-15",
            "amount": 1200,
            "description": "B",
        })
        res = client.get("/api/transportation/2026/5")
        assert res.json()["total_amount"] == 1700


# ---------- 交通費更新 ----------

class TestUpdateExpense:
    def test_update(self, client):
        added = add_expense(client).json()
        expense_id = added["expenses"][0]["id"]
        res = client.put(
            f"/api/transportation/2026/5/expenses/{expense_id}",
            json={"amount": 800, "description": "更新後"},
        )
        assert res.status_code == 200
        expense = res.json()["expenses"][0]
        assert expense["amount"] == 800
        assert expense["description"] == "更新後"

    def test_update_fixed_fails(self, client, db):
        added = add_expense(client).json()
        expense_id = added["expenses"][0]["id"]
        fix_summary(db, 2026, 5)
        res = client.put(
            f"/api/transportation/2026/5/expenses/{expense_id}",
            json={"amount": 800},
        )
        assert res.status_code == 400

    def test_update_not_found(self, client):
        add_expense(client)
        res = client.put(
            f"/api/transportation/2026/5/expenses/{uuid.uuid4()}",
            json={"amount": 800},
        )
        assert res.status_code == 404


# ---------- 交通費削除 ----------

class TestDeleteExpense:
    def test_delete(self, client):
        added = add_expense(client).json()
        expense_id = added["expenses"][0]["id"]
        res = client.delete(
            f"/api/transportation/2026/5/expenses/{expense_id}"
        )
        assert res.status_code == 204

        res = client.get("/api/transportation/2026/5")
        assert res.json()["expenses"] == []

    def test_delete_fixed_fails(self, client, db):
        added = add_expense(client).json()
        expense_id = added["expenses"][0]["id"]
        fix_summary(db, 2026, 5)
        res = client.delete(
            f"/api/transportation/2026/5/expenses/{expense_id}"
        )
        assert res.status_code == 400

    def test_delete_not_found(self, client):
        add_expense(client)
        res = client.delete(
            f"/api/transportation/2026/5/expenses/{uuid.uuid4()}"
        )
        assert res.status_code == 404


# ---------- CSVエクスポート ----------

class TestExportCsv:
    def test_export_specific_month(self, client):
        add_expense(client)
        res = client.get("/api/transportation/export?year=2026&month=5")
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
        lines = res.text.strip().split("\n")
        assert lines[0] == "年月,日付,金額,内容"
        assert "2026-05" in lines[1]
        assert "500" in lines[1]

    def test_export_empty(self, client):
        res = client.get("/api/transportation/export?year=2099&month=1")
        assert res.status_code == 200
        lines = res.text.strip().split("\n")
        assert len(lines) == 1  # ヘッダー行のみ

    def test_export_no_params(self, client):
        add_expense(client)
        res = client.get("/api/transportation/export")
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
