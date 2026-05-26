# App Template

habit-trackerをベースにした新規アプリ作成用テンプレート。

## 使い方

1. このリポジトリをテンプレートとして新しいリポジトリを作成
2. `TEMPLATE_APP` を新しいアプリ名に一括置換
3. `backend/models.py` にドメインモデルを追加
4. `backend/domain/enums.py` にアプリ固有のEnumを追加
5. 環境変数を設定（`.env.example` を参考に）
6. `alembic init` でマイグレーション設定

## 含まれているもの
- GitHub Actions（CI/CD・AIレビュー・PR自動作成）
- DDDパターンの基盤（値オブジェクト・リポジトリ・例外）
- NextAuth.js認証（Google OAuth）
- バックエンド障害時のエラー表示
- CLAUDE.md（開発ルール）
- マルチエージェント開発環境（.claude/）

## 技術スタック
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Backend: FastAPI + SQLAlchemy + Alembic
- DB: PostgreSQL（Supabase）
- 認証: NextAuth.js（Google OAuth）
- Infrastructure: Vercel + Railway
