#!/usr/bin/env python3
"""
GitHub PR 自动审查 - GitHub Actions 版本
"""
import requests
import os
import subprocess

M3_ULTRA_URL = os.environ.get("M3_ULTRA_URL", "http://192.168.1.123:8001")
M3_ULTRA_MODEL = os.environ.get("M3_ULTRA_MODEL", "Qwen3.5-397B-A17B-4bit")
M3_ULTRA_API_KEY = os.environ.get("M3_ULTRA_API_KEY", "123456")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO = os.environ.get("GITHUB_REPOSITORY", "SethCheung/film-studio-tools")


def call_llm(content: str) -> str:
    try:
        resp = requests.post(
            f"{M3_ULTRA_URL}/v1/chat/completions",
            headers={"Authorization": f"Bearer {M3_ULTRA_API_KEY}"},
            json={
                "model": M3_ULTRA_MODEL,
                "messages": [
                    {"role": "system", "content": "你是一位严格但建设性的代码审查专家。"},
                    {"role": "user", "content": f"审查以下代码更改，提供质量评分(1-10)、问题和建议。只回复审查意见。\n\n{content[:6000]}"}
                ],
                "max_tokens": 1500,
                "temperature": 0.3
            },
            timeout=120
        )
        return resp.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"API 调用失败: {e}"


def post_review(body: str, event: str = "COMMENT"):
    pr_number = os.environ.get("PR_NUMBER")
    if not pr_number or not GITHUB_TOKEN:
        return
    url = f"https://api.github.com/repos/{REPO}/pulls/{pr_number}/reviews"
    requests.post(
        url,
        headers={"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"},
        json={"body": body, "event": event}
    )


def main():
    # 获取 diff
    result = subprocess.run(
        ["git", "diff", "origin/main...HEAD"],
        capture_output=True, text=True
    )

    if not result.stdout:
        print("没有发现更改")
        return

    print("🤖 AI 审查中 (M3 Ultra: Qwen3.5-397B)...\n")
    review = call_llm(result.stdout)

    print("=" * 60)
    print("审查结果:")
    print("=" * 60)
    print(review)

    # 帖子 GitHub 评论
    post_review(f"## 🤖 AI 审查结果\n\n{review}")


if __name__ == "__main__":
    main()
