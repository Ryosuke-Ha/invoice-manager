# invoice-manager

フリーランス向け請求書管理アプリ。freee連携・リマインド通知・交通費管理が主な機能。

## 機能

- freee APIを使った請求書の作成・管理
- Slackリマインド通知（請求期限・入金確認）
- 交通費の記録・集計

## 技術スタック

- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Backend: FastAPI + SQLAlchemy + Alembic
- DB: PostgreSQL（Supabase）
- 認証: NextAuth.js（Google OAuth）
- 外部連携: freee API / Slack Incoming Webhook
- Infrastructure: Vercel（Frontend）+ Railway（Backend）

## 環境変数

### Backend（backend/.env）

`backend/.env.example` を参照。

```bash
cp backend/.env.example backend/.env
```

### Frontend（frontend/.env.local）

`frontend/.env.example` を参照。

```bash
cp frontend/.env.example frontend/.env.local
```

## セキュリティ

- 環境変数は絶対にコミットしないこと
- `backend/.env`・`frontend/.env.local` は `.gitignore` で除外済み
- freee トークンは `backend/.tokens/` に保存されるが `.gitignore` で除外済み
- 本番環境の秘密鍵は Railway・Vercel のダッシュボードで管理

## セットアップ

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
