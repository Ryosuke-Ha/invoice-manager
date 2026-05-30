import calendar
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


SAMPLE_TEMPLATE = {
    "title": "月次開発費",
    "amount": 500000,
    "auto_generate": False,
}


def create_template(client, payload=None):
    return client.post("/api/templates", json=payload or SAMPLE_TEMPLATE)


# ---------- テンプレート一覧 ----------

class TestListTemplates:
    def test_empty(self, client):
        res = client.get("/api/templates")
        assert res.status_code == 200
        assert res.json() == []

    def test_list(self, client):
        create_template(client)
        res = client.get("/api/templates")
        assert res.status_code == 200
        assert len(res.json()) == 1


# ---------- テンプレート1件取得 ----------

class TestGetTemplate:
    def test_found(self, client):
        created = create_template(client).json()
        res = client.get(f"/api/templates/{created['id']}")
        assert res.status_code == 200
        assert res.json()["title"] == "月次開発費"

    def test_not_found(self, client):
        res = client.get("/api/templates/00000000-0000-0000-0000-000000000000")
        assert res.status_code == 404


# ---------- テンプレート作成 ----------

class TestCreateTemplate:
    def test_create(self, client):
        res = create_template(client)
        assert res.status_code == 201
        body = res.json()
        assert body["title"] == "月次開発費"
        assert body["amount"] == 500000
        assert body["auto_generate"] is False
        assert "id" in body


# ---------- テンプレート更新 ----------

class TestUpdateTemplate:
    def test_update(self, client):
        created = create_template(client).json()
        res = client.put(
            f"/api/templates/{created['id']}",
            json={"title": "月次コンサルティング費", "amount": 300000},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["title"] == "月次コンサルティング費"
        assert body["amount"] == 300000

    def test_update_not_found(self, client):
        res = client.put(
            "/api/templates/00000000-0000-0000-0000-000000000000",
            json={"title": "テスト"},
        )
        assert res.status_code == 404


# ---------- テンプレート削除 ----------

class TestDeleteTemplate:
    def test_delete(self, client):
        created = create_template(client).json()
        res = client.delete(f"/api/templates/{created['id']}")
        assert res.status_code == 204

        res = client.get(f"/api/templates/{created['id']}")
        assert res.status_code == 404

    def test_delete_not_found(self, client):
        res = client.delete(
            "/api/templates/00000000-0000-0000-0000-000000000000"
        )
        assert res.status_code == 404


# ---------- テンプレートから請求書生成 ----------

class TestCreateInvoiceFromTemplate:
    def test_create_from_template_fields(self, client):
        tmpl = create_template(client).json()
        res = client.post(
            "/api/invoices",
            json={"template_id": tmpl["id"], "year": 2026, "month": 5},
        )
        assert res.status_code == 201
        body = res.json()
        assert body["title"] == "月次開発費"
        assert body["amount"] == 500000
        assert body["status"] == "draft"
        assert body["freee_sync_status"] == "unsynced"
        assert body["template_id"] == tmpl["id"]

    def test_create_from_template_issue_date_is_first_day(self, client):
        tmpl = create_template(client).json()
        res = client.post(
            "/api/invoices",
            json={"template_id": tmpl["id"], "year": 2026, "month": 5},
        )
        assert res.status_code == 201
        assert res.json()["issue_date"] == "2026-05-01"

    def test_create_from_template_due_date_is_last_day(self, client):
        tmpl = create_template(client).json()
        res = client.post(
            "/api/invoices",
            json={"template_id": tmpl["id"], "year": 2026, "month": 5},
        )
        assert res.status_code == 201
        last_day = calendar.monthrange(2026, 5)[1]
        assert res.json()["due_date"] == f"2026-05-{last_day:02d}"

    def test_create_from_template_default_year_month(self, client):
        """year・month 未指定時は当月を使用"""
        now = datetime.now(JST)
        tmpl = create_template(client).json()
        res = client.post(
            "/api/invoices",
            json={"template_id": tmpl["id"]},
        )
        assert res.status_code == 201
        body = res.json()
        assert body["issue_date"].startswith(f"{now.year}-{now.month:02d}")

    def test_create_from_template_february_last_day(self, client):
        """うるう年の2月末日"""
        tmpl = create_template(client).json()
        res = client.post(
            "/api/invoices",
            json={"template_id": tmpl["id"], "year": 2028, "month": 2},
        )
        assert res.status_code == 201
        assert res.json()["due_date"] == "2028-02-29"

    def test_create_from_nonexistent_template_fails(self, client):
        res = client.post(
            "/api/invoices",
            json={
                "template_id": "00000000-0000-0000-0000-000000000000",
                "year": 2026,
                "month": 5,
            },
        )
        assert res.status_code == 400
