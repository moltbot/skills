---
name: local-model-fallback
description: 多模型智能切换。使用指令 mlti llm 启动本地模型选择功能。
trigger: mlti llm
---

# 多模型智能切换 (Multi-LLM Fallback)

**触发指令**: `mlti llm`

> **默认行为**: 始终使用 Claude Opus 4.5 (最强模型)
> 只有在消息中包含 `mlti llm` 指令时，才会启动本地模型智能选择功能。

## 使用方式

### 默认模式（不使用指令）
```
帮我写一个Python函数 -> 使用 Claude Opus 4.5
```

### 多模型模式（使用指令）
```
mlti llm 帮我写一个Python函数 -> 选择 qwen2.5-coder:32b
mlti llm 分析这个数学证明 -> 选择 deepseek-r1:70b
```

## 指令格式

| 指令 | 说明 |
|------|------|
| `mlti llm` | 启动多模型智能选择 |
| `mlti llm coding` | 强制使用编程模型 |
| `mlti llm reasoning` | 强制使用推理模型 |
| `mlti llm chinese` | 强制使用中文模型 |
| `mlti llm general` | 强制使用通用模型 |

## 模型映射

**主模型（默认）**: github-copilot/claude-opus-4.5

**本地模型（mlti llm 触发时）**:
| 任务类型 | 模型 | 大小 |
|----------|------|------|
| 编程任务 | qwen2.5-coder:32b | 19GB |
| 推理任务 | deepseek-r1:70b | 42GB |
| 中文轻量 | glm4:9b | 5.5GB |
| 通用任务 | qwen3:32b | 20GB |

## 检测逻辑

```
用户输入
    |
    v
包含 "mlti llm"?
    |
    +-- 否 -> 使用 Claude Opus 4.5 (默认)
    |
    +-- 是 -> 任务类型检测
                |
        +-------+-------+-------+
        v       v       v       v
      编程    推理    中文    通用
        |       |       |       |
        v       v       v       v
    qwen2.5  deepseek  glm4   qwen3
    coder    r1:70b    :9b    :32b
```
