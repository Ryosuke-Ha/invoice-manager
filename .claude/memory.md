# Memory - invoice-manager

## 重要な決定事項
- テンプレート: app-template（habit-trackerベース）
- デプロイ: Vercel（frontend）+ Railway（backend）
- DB: PostgreSQL（Supabase）
- 認証: NextAuth.js（Google OAuth）

## 技術的負債
（なし）

## 注意事項
- タイムゾーンは常にJST（UTC+9）で計算すること
- 外部APIコール（freee・Slack）は必ずtry/exceptで囲む
- バッチAPIは BATCH_SECRET_KEY で認証すること
