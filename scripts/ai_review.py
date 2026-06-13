"""AI Code Review script for GitHub Actions.

Fetches the PR diff and posts a review comment via Claude API.
Supports both 'opened' and 'synchronize' PR events.
"""
import os
import subprocess
import sys

import anthropic
from github import Github

MAX_DIFF_CHARS = 30000


def get_diff(base_sha: str, head_sha: str) -> str:
    """Get git diff between base and head SHAs."""
    print(f"[ai_review] BASE_SHA={base_sha!r} HEAD_SHA={head_sha!r}")

    if not base_sha:
        print("[ai_review] BASE_SHA is empty, falling back to git merge-base")
        result = subprocess.run(
            ["git", "merge-base", "HEAD", "origin/main"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(f"[ai_review] merge-base failed: {result.stderr}", file=sys.stderr)
            return ""
        base_sha = result.stdout.strip()
        print(f"[ai_review] merge-base resolved to {base_sha!r}")

    result = subprocess.run(
        ["git", "diff", f"{base_sha}...{head_sha}"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"[ai_review] git diff failed: {result.stderr}", file=sys.stderr)
        return ""

    return result.stdout


def build_prompt(diff: str) -> str:
    if len(diff) > MAX_DIFF_CHARS:
        diff = diff[:MAX_DIFF_CHARS] + "\n\n... (差分が長すぎるため省略されました)"

    return f"""以下のPull Requestの差分をレビューしてください。

## レビュー観点
- バグ・ロジックエラー
- セキュリティ問題（SQLインジェクション、XSS、認証漏れ等）
- パフォーマンス問題
- コードの可読性・保守性
- 型安全性（TypeScript）
- Python PEP8・型ヒントの欠如

## 出力形式
Markdownで出力してください。
問題がない場合は「✅ 問題なし」と記載してください。
指摘がある場合はファイル名・行番号を明記してください。

## 差分
```diff
{diff}
```"""


def post_comment(repo_name: str, pr_number: int, body: str) -> None:
    token = os.environ.get("GITHUB_TOKEN", "")
    g = Github(token)
    repo = g.get_repo(repo_name)
    pr = repo.get_pull(pr_number)
    pr.create_issue_comment(body)
    print(f"[ai_review] Comment posted to PR #{pr_number}")


def main() -> None:
    base_sha = os.environ.get("BASE_SHA", "")
    head_sha = os.environ.get("HEAD_SHA", "")
    pr_number = int(os.environ.get("PR_NUMBER", "0"))
    repo_name = os.environ.get("REPO_NAME", "")
    anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY", "")

    if not pr_number or not repo_name:
        print("[ai_review] PR_NUMBER or REPO_NAME is not set", file=sys.stderr)
        sys.exit(1)

    diff = get_diff(base_sha, head_sha)
    if not diff.strip():
        print("[ai_review] No diff found, skipping review")
        post_comment(repo_name, pr_number, "ℹ️ 差分が検出されませんでした。レビューをスキップします。")
        return

    print(f"[ai_review] Diff size: {len(diff)} chars")

    client = anthropic.Anthropic(api_key=anthropic_api_key)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": build_prompt(diff)}],
    )
    review_text = message.content[0].text

    comment_body = f"## 🤖 AI Code Review\n\n{review_text}"
    post_comment(repo_name, pr_number, comment_body)


if __name__ == "__main__":
    main()
