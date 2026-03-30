#!/usr/bin/env python3
"""
AIMax上的Qwen3-72B推理API服务器
OpenAI兼容接口，供AI Agent调用
"""
from llama_cpp import Llama
from flask import Flask, request, jsonify
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

MODEL_PATH = os.environ.get("MODEL_PATH", "/home/seth/models/qwen35/Qwen3.5-35B-A3B-Q5_K_M.gguf")
GPU_LAYERS = int(os.environ.get("GPU_LAYERS", "0"))  # 0=CPU only, 999=all GPU
PORT = int(os.environ.get("PORT", 8080))

print(f"正在加载模型: {MODEL_PATH}, GPU_layers={GPU_LAYERS}")
llm = Llama(
    model_path=MODEL_PATH,
    n_gpu_layers=GPU_LAYERS,
    n_ctx=2048,
    n_threads=16,
    verbose=True
)
print("模型加载完成!")

@app.route("/v1/chat/completions", methods=["POST"])
def chat_completions():
    data = request.json
    messages = data.get("messages", [])
    max_tokens = data.get("max_tokens", 512)
    temperature = data.get("temperature", 0.7)

    # 转换messages为prompt
    prompt_parts = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            prompt_parts.append(f"System: {content}")
        elif role == "user":
            prompt_parts.append(f"User: {content}")
        else:
            prompt_parts.append(f"Assistant: {content}")

    prompt = "\n\n".join(prompt_parts) + "\n\nAssistant:"

    result = llm.create_completion(
        prompt=prompt,
        max_tokens=max_tokens,
        temperature=temperature,
        stop=["User:", "\n\nUser:"],
    )

    return jsonify({
        "id": "chatcmpl-" + str(os.urandom(8).hex()),
        "object": "chat.completion",
        "created": 1234567890,
        "model": "Qwen3-72B-Instruct-Q5_K_M",
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": result["choices"][0]["text"]
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": len(prompt.split()),
            "completion_tokens": result["usage"]["completion_tokens"],
            "total_tokens": len(prompt.split()) + result["usage"]["completion_tokens"]
        }
    })

@app.route("/v1/models", methods=["GET"])
def list_models():
    return jsonify({
        "object": "list",
        "data": [{
            "id": "Qwen3-72B-Instruct-Q5_K_M",
            "object": "model",
            "created": 1234567890,
            "owned_by": "local"
        }]
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "Qwen3-72B-Instruct-Q5_K_M"})

if __name__ == "__main__":
    print(f"启动API服务: http://0.0.0.0:{PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=False)