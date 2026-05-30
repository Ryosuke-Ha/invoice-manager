import os

# テスト実行時はSQLiteを使用（Supabase接続タイムアウト防止）
os.environ.setdefault("DATABASE_URL", "sqlite:///./app.db")
