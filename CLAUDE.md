# CLAUDE.md

This file provides guidance to Claude Code when working with the TEMPLATE_APP repository.

## Project Overview

TEMPLATE_APP は habit-tracker をベースにした Web アプリケーション。

**Core philosophy**: Business logic lives in the API layer. The database stores data only. AI receives pre-processed context, not raw data.

**Tech Stack**:
- Frontend: Next.js 14 (TypeScript, App Router) + Tailwind CSS
- Backend: FastAPI (Python 3.11) + SQLAlchemy + Alembic
- Database: PostgreSQL (Supabase)
- Infrastructure: Vercel (Frontend) + Railway (Backend)
- 認証: NextAuth.js（Google OAuth）

## Key Commands

### Backend
```
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0   # 開発サーバー起動
pytest                                       # テスト実行
flake8 .                                     # Lint
alembic upgrade head                         # マイグレーション適用
alembic revision --autogenerate -m "desc"   # マイグレーション作成
```

### Frontend
```
cd frontend
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run type-check   # TypeScript チェック
```

**IMPORTANT**: After modifying backend code, always run `flake8 .` before committing.
**IMPORTANT**: After modifying frontend code, always run `npm run type-check` before committing.
**IMPORTANT**: Never commit `.env`, `.env.local`, `backend/.env` files.
**IMPORTANT**: Never hardcode API URLs. Always use environment variables.

## Architecture

### API Design Principle
APIs must contain business logic. Do NOT return raw database records directly.
Pre-process and aggregate data before returning to clients.

### Authentication
- Web: NextAuth.js (Google OAuth)

### Database
- ORM: SQLAlchemy with Alembic migrations
- All schema changes must go through Alembic migrations
- Never modify the database schema directly

## Directory Structure

| Path | Purpose |
|------|---------|
| frontend/app/ | Next.js App Router pages |
| frontend/components/ | Reusable React components |
| frontend/hooks/ | Custom React hooks |
| backend/routers/ | FastAPI route handlers（ここにアプリ固有のルーターを追加） |
| backend/models.py | SQLAlchemy models |
| backend/database.py | Database connection |
| backend/domain/ | Value Objects, Enums, Exceptions |
| backend/repositories/ | DB access layer |
| backend/services/ | Cross-aggregate business logic |
| .github/workflows/ | GitHub Actions CI/CD |

## Coding Rules

### Python (Backend)
- Follow PEP8
- Use type hints for all function arguments and return values
- Use JST (UTC+9) for all datetime calculations, never UTC
- Always use try/except for external API calls
- Log errors with sufficient context (user_id, endpoint, error message)

### TypeScript (Frontend)
- strict mode is enabled, never use `any`
- Use optimistic UI for all user interactions (check, add, delete)
- Always handle loading and error states
- Font size must be 16px or larger on mobile (prevents iOS auto-zoom)

### Security Rules
- Never write secrets in code. Use environment variables only.
- Validate all external inputs before processing

## Common Pitfalls

- **Timezone**: Server runs on UTC. Always convert to JST for date calculations.
- **Git diverged branches**: Run `git config pull.rebase false` then `git pull`.
- **Supabase paused**: Free tier pauses after inactivity. Check dashboard if DB connection fails.
- **flake8 E402**: All imports must be at the top of the file.
- **iOS zoom**: Input elements must have font-size >= 16px.

## Environment Variables

See `.env.example` files in each directory for required variables.
Never commit actual values. Use Railway/Vercel dashboard for production secrets.

## Development Workflow

### Branch Strategy
- main: production branch（直接push禁止）
- feature/issue-{番号}-{概要}: 新機能
- fix/issue-{番号}-{概要}: バグ修正
- refactor/issue-{番号}-{概要}: リファクタリング

### Flow
1. GitHub Issueを作成（要件定義・設計・工数見積もり）
2. ブランチを作成: feature/issue-{番号}-{概要}
3. 実装（Claude Codeに「Issue #〇〇を実装して」と投げる）
4. PRを作成（Issueと紐づけ: closes #〇〇）
5. CIが通ることを確認
6. mainへマージ → 自動デプロイ

### When to Skip Full Flow
軽微な修正（設計書更新不要）:
- UIの微調整・文言変更
- バグ修正（影響範囲が明確）
- テストの追加

フルフロー必須:
- 新しいAPIエンドポイント
- DBスキーマの変更
- 複数コンポーネントにまたがる変更

## Multi-Agent Development

マルチエージェント開発の手順は .claude/agents.mdを参照すること。
タスクの進捗は .claude/progress.mdで管理する。

### セッション開始時の必須確認
1. .claude/memory.mdを読む（重要な決定事項・技術的負債）
2. .claude/progress.mdを読む（現在のタスク状況）
3. 該当するCLAUDE.mdを読む（backend/またはfrontend/）
