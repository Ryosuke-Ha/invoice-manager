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


SAMPLE_PAYLOAD = {
    "name": "売上高",
    "account_type": "income",
    "freee_company_id": 1,
    "freee_account_item_id": 100,
    "freee_tax_code": 1,
}


def create_sample(client):
    return client.post("/api/account-titles", json=SAMPLE_PAYLOAD)


# ---------- 一覧取得 ----------

class TestListAccountTitles:
    def test_empty(self, client):
        res = client.get("/api/account-titles")
        assert res.status_code == 200
        assert res.json() == []

    def test_active_only_true(self, client):
        create_sample(client)
        res = client.get("/api/account-titles?active_only=true")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_active_only_false_includes_inactive(self, client):
        created = create_sample(client).json()
        client.delete(f"/api/account-titles/{created['id']}")
        res = client.get("/api/account-titles?active_only=false")
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_active_only_true_excludes_inactive(self, client):
        created = create_sample(client).json()
        client.delete(f"/api/account-titles/{created['id']}")
        res = client.get("/api/account-titles?active_only=true")
        assert res.status_code == 200
        assert res.json() == []


# ---------- 1件取得 ----------

class TestGetAccountTitle:
    def test_found(self, client):
        created = create_sample(client).json()
        res = client.get(f"/api/account-titles/{created['id']}")
        assert res.status_code == 200
        assert res.json()["name"] == "売上高"

    def test_not_found(self, client):
        res = client.get("/api/account-titles/00000000-0000-0000-0000-000000000000")
        assert res.status_code == 404


# ---------- 作成 ----------

class TestCreateAccountTitle:
    def test_create(self, client):
        res = create_sample(client)
        assert res.status_code == 201
        body = res.json()
        assert body["name"] == "売上高"
        assert body["account_type"] == "income"
        assert body["is_active"] is True
        assert "id" in body


# ---------- 更新 ----------

class TestUpdateAccountTitle:
    def test_update(self, client):
        created = create_sample(client).json()
        res = client.put(
            f"/api/account-titles/{created['id']}",
            json={"name": "受取手数料"},
        )
        assert res.status_code == 200
        assert res.json()["name"] == "受取手数料"
        assert res.json()["account_type"] == "income"

    def test_update_not_found(self, client):
        res = client.put(
            "/api/account-titles/00000000-0000-0000-0000-000000000000",
            json={"name": "テスト"},
        )
        assert res.status_code == 404


# ---------- 無効化 ----------

class TestDeleteAccountTitle:
    def test_deactivate_no_reference(self, client):
        created = create_sample(client).json()
        res = client.delete(f"/api/account-titles/{created['id']}")
        assert res.status_code == 204

        # is_active=False になっていること
        res = client.get(
            f"/api/account-titles/{created['id']}"
        )
        assert res.json()["is_active"] is False

    def test_deactivate_with_reference(self, client, db):
        import uuid
        from datetime import date
        from models import Invoice

        created = create_sample(client).json()

        # 請求書で参照
        invoice = Invoice(
            title="テスト請求書",
            amount=100000,
            due_date=date(2026, 6, 30),
            issue_date=date(2026, 5, 1),
            account_title_id=uuid.UUID(created["id"]),
        )
        db.add(invoice)
        db.commit()

        res = client.delete(f"/api/account-titles/{created['id']}")
        assert res.status_code == 400
        assert "参照" in res.json()["detail"]

    def test_delete_not_found(self, client):
        res = client.delete(
            "/api/account-titles/00000000-0000-0000-0000-000000000000"
        )
        assert res.status_code == 404
