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


def future_str(days=30):
    return (datetime.now(JST).date() + timedelta(days=days)).isoformat()


BASE_PAYLOAD = {
    "title": "テスト請求書",
    "amount": 300000,
    "due_date": future_str(),
    "issue_date": today_str(),
}


def create_invoice(client):
    return client.post("/api/invoices", json=BASE_PAYLOAD).json()


def set_status(client, id: str, status: str):
    return client.put(f"/api/invoices/{id}/status", json={"status": status})


def force_status(db, invoice_id: str, status: str):
    """DBを直接操作してステータスを変更する"""
    import uuid
    from models import Invoice
    db.query(Invoice).filter(
        Invoice.id == uuid.UUID(invoice_id)
    ).update({"status": status})
    db.commit()


# ---------- 正常遷移 ----------

class TestValidTransitions:
    def test_draft_to_sent(self, client):
        inv = create_invoice(client)
        res = set_status(client, inv["id"], "sent")
        assert res.status_code == 200
        assert res.json()["status"] == "sent"

    def test_sent_to_reminding(self, client, db):
        inv = create_invoice(client)
        force_status(db, inv["id"], "sent")
        res = set_status(client, inv["id"], "reminding")
        assert res.status_code == 200
        assert res.json()["status"] == "reminding"

    def test_sent_to_overdue(self, client, db):
        inv = create_invoice(client)
        force_status(db, inv["id"], "sent")
        res = set_status(client, inv["id"], "overdue")
        assert res.status_code == 200
        assert res.json()["status"] == "overdue"

    def test_reminding_to_overdue(self, client, db):
        inv = create_invoice(client)
        force_status(db, inv["id"], "reminding")
        res = set_status(client, inv["id"], "overdue")
        assert res.status_code == 200
        assert res.json()["status"] == "overdue"

    def test_overdue_to_paid(self, client, db):
        inv = create_invoice(client)
        force_status(db, inv["id"], "overdue")
        res = set_status(client, inv["id"], "paid")
        assert res.status_code == 200
        assert res.json()["status"] == "paid"

    def test_paid_to_synced_to_freee(self, client, db):
        inv = create_invoice(client)
        force_status(db, inv["id"], "paid")
        res = set_status(client, inv["id"], "synced_to_freee")
        assert res.status_code == 200
        assert res.json()["status"] == "synced_to_freee"

    def test_synced_to_completed(self, client, db):
        inv = create_invoice(client)
        force_status(db, inv["id"], "synced_to_freee")
        res = set_status(client, inv["id"], "completed")
        assert res.status_code == 200
        assert res.json()["status"] == "completed"


# ---------- 不正遷移 ----------

class TestInvalidTransitions:
    def test_draft_to_paid(self, client):
        inv = create_invoice(client)
        res = set_status(client, inv["id"], "paid")
        assert res.status_code == 400

    def test_draft_to_overdue(self, client):
        inv = create_invoice(client)
        res = set_status(client, inv["id"], "overdue")
        assert res.status_code == 400

    def test_draft_to_completed(self, client):
        inv = create_invoice(client)
        res = set_status(client, inv["id"], "completed")
        assert res.status_code == 400

    def test_completed_to_draft(self, client, db):
        inv = create_invoice(client)
        force_status(db, inv["id"], "completed")
        res = set_status(client, inv["id"], "draft")
        assert res.status_code == 400

    def test_paid_to_draft(self, client, db):
        inv = create_invoice(client)
        force_status(db, inv["id"], "paid")
        res = set_status(client, inv["id"], "draft")
        assert res.status_code == 400

    def test_not_found(self, client):
        res = set_status(
            client, "00000000-0000-0000-0000-000000000000", "sent"
        )
        assert res.status_code == 404


# ---------- PAID 遷移時の paid_date ----------

class TestPaidDate:
    def test_paid_date_set_on_paid_transition(self, client, db):
        inv = create_invoice(client)
        force_status(db, inv["id"], "reminding")
        res = set_status(client, inv["id"], "paid")
        assert res.status_code == 200
        body = res.json()
        assert body["paid_date"] is not None
        assert body["paid_date"] == datetime.now(JST).date().isoformat()

    def test_paid_date_not_set_on_other_transitions(self, client):
        inv = create_invoice(client)
        res = set_status(client, inv["id"], "sent")
        assert res.status_code == 200
        assert res.json()["paid_date"] is None

    def test_paid_date_is_jst(self, client, db):
        inv = create_invoice(client)
        force_status(db, inv["id"], "overdue")
        res = set_status(client, inv["id"], "paid")
        assert res.status_code == 200
        jst_today = datetime.now(JST).date().isoformat()
        assert res.json()["paid_date"] == jst_today
