#!/usr/bin/env python3
"""
AI Code Reviewer - 使用 M3 Ultra 的 Qwen3.5-397B 模型审查代码
在 AI Max 上运行，调用 M3 Ultra 的 oMLX API
"""
import requests
import json
import sys
import os
from datetime import datetime

# 配置
M3_ULTRA_URL = os.environ.get("M3_ULTRA_URL", "http://192.168.1.123:8001")
MODEL = os.environ.get("M3_ULTRA_MODEL", "Qwen3.5-397B-A17B-4bit")
M3_ULTRA_API_KEY = os.environ.get("M3_ULTRA_API_KEY", "123456")

REVIEW_PROMPT = """你是一位资深代码审查专家。请审查以下代码，提供：
1. 代码质量评估（1-10分）
2. 发现的问题（如果有）
3. 改进建议

只回复审查意见，不要废话。

---要审查的代码---
{code}

---代码文件路径---
{filepath}
"""


def call_llm(prompt: str) -> str:
    """调用 M3 Ultra 的 oMLX API"""
    try:
        response = requests.post(
            f"{M3_ULTRA_URL}/v1/chat/completions",
            headers={"Authorization": f"Bearer {M3_ULTRA_API_KEY}"},
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": "你是一位严格但建设性的代码审查专家。"},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 2048,
                "temperature": 0.3
            },
            timeout=120
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        return f"API 调用失败: {e}"


def review_file(filepath: str) -> str:
    """审查单个文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
    except Exception as e:
        return f"读取文件失败: {e}"

    prompt = REVIEW_PROMPT.format(code=code[:8000], filepath=filepath)  # 限制长度
    return call_llm(prompt)


def review_changes() -> str:
    """审查 Git 未提交的更改"""
    import subprocess

    # 获取 diff
    result = subprocess.run(
        ["git", "diff", "--staged"],
        capture_output=True, text=True
    )
    if not result.stdout:
        result = subprocess.run(
            ["git", "diff"],
            capture_output=True, text=True
        )

    if not result.stdout:
        return "没有发现代码更改"

    prompt = REVIEW_PROMPT.format(code=result.stdout[:8000], filepath="Git Changes")
    return call_llm(prompt)


def main():
    if len(sys.argv) > 1:
        # 审查指定文件
        for filepath in sys.argv[1:]:
            print(f"\n{'='*60}")
            print(f"审查: {filepath}")
            print('='*60)
            result = review_file(filepath)
            print(result)
    else:
        # 审查所有未提交的更改
        print(f"\n{'='*60}")
        print(f"代码审查 - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print(f"使用模型: {MODEL} @ {M3_ULTRA_URL}")
        print('='*60)
        result = review_changes()
        print(result)


if __name__ == "__main__":
    main()
