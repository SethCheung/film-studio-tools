from llama_cpp import Llama
import time

print("加载模型中...")
start = time.time()
llm = Llama(
    model_path="/home/seth/models/qwen/Qwen3-72B-Instruct.Q5_K_M.gguf",
    n_gpu_layers=999,
    n_ctx=4096,
    n_threads=16,
    verbose=False
)
print(f"加载时间: {time.time()-start:.1f}秒")

print("测试推理...")
start = time.time()
result = llm.create_chat_message(
    messages=[{"role": "user", "content": "用一句话解释什么是Python"}],
    max_tokens=50
)
print(f"推理时间: {time.time()-start:.1f}秒")
print(f"回复: {result['message']['content']}")