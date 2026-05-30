from datetime import timedelta, datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app

JST = timezone(timedelta(hours=9))

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


def today_str():
    return datetime.now(JST).date().isoformat()


def past_str():
    return (datetime.now(JST).date() - timedelta(days=1)).isoformat()


def future_str():
    return (datetime.now(JST).date() + timedelta(days=1)).isoformat()


def future_due_str(days=30):
    return (datetime.now(JST).date() + timedelta(days=days)).isoformat()


SAMPLE_PAYLOAD = {
    "title": "2026年5月分請求書",
    "amount": 500000,
    "due_date": future_due_str(),
    "issue_date": today_str(),
}


def create_sample(client, payload=None):
    return client.post("/api/invoices", json=payload or SAMPLE_PAYLOAD)


# ---------- 一覧取得 ----------

class TestListInvoices:
    def test_empty(self, client):
        res = client.get("/api/invoices")
        assert res.status_code == 200
        assert res.json() == []

    def test_list_all(self, client):
        create_sample(client)
        res = client.get("/api/invoices")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_filter_by_status_match(self, client):
        create_sample(client)
        res = client.get("/api/invoices?status=draft")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_filter_by_status_no_match(self, client):
        create_sample(client)
        res = client.get("/api/invoices?status=sent")
        assert res.status_code == 200
        assert res.json() == []


# ---------- 1件取得 ----------

class TestGetInvoice:
    def test_found(self, client):
        created = create_sample(client).json()
        res = client.get(f"/api/invoices/{created['id']}")
        assert res.status_code == 200
        assert res.json()["title"] == "2026年5月分請求書"

    def test_not_found(self, client):
        res = client.get("/api/invoices/00000000-0000-0000-0000-000000000000")
        assert res.status_code == 404


# ---------- 作成 ----------

class TestCreateInvoice:
    def test_create_success(self, client):
        res = create_sample(client)
        assert res.status_code == 201
        body = res.json()
        assert body["title"] == "2026年5月分請求書"
        assert body["amount"] == 500000
        assert body["status"] == "draft"
        assert body["freee_sync_status"] == "unsynced"
        assert "id" in body

    def test_create_amount_zero_fails(self, client):
        payload = {**SAMPLE_PAYLOAD, "amount": 0}
        res = client.post("/api/invoices", json=payload)
        assert res.status_code == 400

    def test_create_amount_negative_fails(self, client):
        payload = {**SAMPLE_PAYLOAD, "amount": -1}
        res = client.post("/api/invoices", json=payload)
        assert res.status_code == 400

    def test_create_future_issue_date_fails(self, client):
        payload = {**SAMPLE_PAYLOAD, "issue_date": future_str()}
        res = client.post("/api/invoices", json=payload)
        assert res.status_code == 400

    def test_create_today_issue_date_ok(self, client):
        payload = {**SAMPLE_PAYLOAD, "issue_date": today_str()}
        res = client.post("/api/invoices", json=payload)
        assert res.status_code == 201

    def test_create_past_issue_date_ok(self, client):
        payload = {**SAMPLE_PAYLOAD, "issue_date": past_str()}
        res = client.post("/api/invoices", json=payload)
        assert res.status_code == 201


# ---------- 更新 ----------

class TestUpdateInvoice:
    def test_update_draft(self, client):
        created = create_sample(client).json()
        res = client.put(
            f"/api/invoices/{created['id']}",
            json={"title": "更新済み請求書", "amount": 600000},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["title"] == "更新済み請求書"
        assert body["amount"] == 600000

    def test_update_non_draft_fails(self, client, db):
        import uuid
        from models import Invoice as InvoiceModel
        created = create_sample(client).json()

        # ステータスを手動で変更
        db.query(InvoiceModel).filter(
            InvoiceModel.id == uuid.UUID(created["id"])
        ).update({"status": "sent"})
        db.commit()

        res = client.put(
            f"/api/invoices/{created['id']}",
            json={"title": "変更しようとする"},
        )
        assert res.status_code == 400

    def test_update_not_found(self, client):
        res = client.put(
            "/api/invoices/00000000-0000-0000-0000-000000000000",
            json={"title": "テスト"},
        )
        assert res.status_code == 404


# ---------- 削除 ----------

class TestDeleteInvoice:
    def test_delete_draft(self, client):
        created = create_sample(client).json()
        res = client.delete(f"/api/invoices/{created['id']}")
        assert res.status_code == 204

        res = client.get(f"/api/invoices/{created['id']}")
        assert res.status_code == 404

    def test_delete_non_draft_fails(self, client, db):
        import uuid
        from models import Invoice as InvoiceModel
        created = create_sample(client).json()

        db.query(InvoiceModel).filter(
            InvoiceModel.id == uuid.UUID(created["id"])
        ).update({"status": "sent"})
        db.commit()

        res = client.delete(f"/api/invoices/{created['id']}")
        assert res.status_code == 400

    def test_delete_not_found(self, client):
        res = client.delete(
            "/api/invoices/00000000-0000-0000-0000-000000000000"
        )
        assert res.status_code == 404
