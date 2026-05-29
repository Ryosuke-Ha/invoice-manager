# Multi-Agent Development - invoice-manager

## 概要
複数のClaude Codeエージェントを並列で動かす際の手順。

## 使い方
1. 依存関係のないIssueを並列実行可能
2. 各エージェントはセッション開始時に memory.md・progress.md を読むこと
3. 作業完了後は progress.md の該当タスクを [x] に更新すること

## 並列実行可能な組み合わせ例
- #4（勘定科目）と #8（交通費）は依存関係なし → 並列OK
- #5（請求書CRUD）は #3（ドメイン層）完了後に着手
- #13〜#16（フロントエンド）はPhase 4完了後に並列実行可能
