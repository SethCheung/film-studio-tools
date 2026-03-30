#!/usr/bin/env python3
"""
AI Code Reviewer - 双机协作代码审查
可以使用 M3 Ultra (Qwen3.5-397B) 或 AI Max (Qwen3-72B) 进行审查
"""
import requests
import json
import sys
import os
from datetime import datetime

# 配置
M3_ULTRA = {
    "url": "http://192.168.1.123:8001",
    "model": "Qwen3.5-397B-A17B-4bit",
    "api_key": "123456"
}

AIMAX = {
    "url": "http://192.168.1.238:8080",
    "model": "Qwen3-72B-Instruct-Q5_K_M",
    "api_key": None
}

REVIEW_PROMPT = """你是一位资深代码审查专家。请审查以下代码，提供：
1. 代码质量评估（1-10分）
2. 发现的问题（如果有）
3. 改进建议

只回复审查意见，简洁直接。

---要审查的代码---
{code}

---代码文件路径---
{filepath}
"""


def call_llm(url: str, model: str, prompt: str, api_key: str = None) -> str:
    """调用 LLM API"""
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        response = requests.post(
            f"{url}/v1/chat/completions",
            headers=headers,
            json={
                "model": model,
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
    except Exception as e:
        return f"API 调用失败: {e}"


def review_file(filepath: str, llm_config: dict) -> str:
    """审查单个文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
    except Exception as e:
        return f"读取文件失败: {e}"

    prompt = REVIEW_PROMPT.format(code=code[:8000], filepath=filepath)
    return call_llm(llm_config["url"], llm_config["model"], prompt, llm_config.get("api_key"))


def review_git_diff(llm_config: dict) -> str:
    """审查 Git 未提交的更改"""
    import subprocess

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
    return call_llm(llm_config["url"], llm_config["model"], prompt, llm_config.get("api_key"))


def test_connection():
    """测试两台机器的连接"""
    print("\n🔍 测试连接...")
    for name, config in [("M3 Ultra", M3_ULTRA), ("AI Max", AIMAX)]:
        try:
            headers = {}
            if config.get("api_key"):
                headers["Authorization"] = f"Bearer {config['api_key']}"
            r = requests.get(f"{config['url']}/v1/models", headers=headers, timeout=5)
            if r.ok:
                models = r.json().get("data", [])
                model_name = models[0]["id"] if models else "unknown"
                print(f"  ✅ {name}: {config['url']} ({model_name})")
            else:
                print(f"  ❌ {name}: HTTP {r.status_code}")
        except Exception as e:
            print(f"  ❌ {name}: {e}")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_connection()
        return

    # 选择模型
    target = os.environ.get("LLM_TARGET", "aimax").lower()

    if target == "m3ultra":
        llm_config = M3_ULTRA
    elif target == "both":
        # 双重审查
        configs = [M3_ULTRA, AIMAX]
    else:
        llm_config = AIMAX

    if target == "both":
        for config in configs:
            name = "M3 Ultra" if config == M3_ULTRA else "AI Max"
            print(f"\n{'='*60}")
            print(f"🤖 {name} 审查")
            print(f"   模型: {config['model']}")
            print('='*60)

            if len(sys.argv) > 1:
                for filepath in sys.argv[1:]:
                    print(f"\n📄 {filepath}")
                    print("-" * 40)
                    print(review_file(filepath, config))
            else:
                print(review_git_diff(config))
    else:
        name = "M3 Ultra" if llm_config == M3_ULTRA else "AI Max"
        print(f"\n{'='*60}")
        print(f"🤖 {name} 代码审查 - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        print(f"   模型: {llm_config['model']}")
        print('='*60)

        if len(sys.argv) > 1:
            for filepath in sys.argv[1:]:
                print(f"\n📄 {filepath}")
                print("-" * 40)
                print(review_file(filepath, llm_config))
        else:
            print(review_git_diff(llm_config))


if __name__ == "__main__":
    main()
