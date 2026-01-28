---
name: save-money
description: "Auto-detect task complexity and route to the right model. Most conversations are everyday tasks — stay on Haiku, save 50%+ on API costs. Only escalate to Sonnet when real thinking is needed. | 自動偵測任務難度，大部分日常對話都用便宜模型，輕鬆省下 50% 以上的 API 費用。只有真正需要深度思考時才升級。"
author: "小安 Ann Agent — Taiwan 台灣"
homepage: https://github.com/peterann/save-money
metadata:
  clawdbot:
    emoji: "🧠"
---

# Save Money

Run on **Haiku** by default. Only spawn **Sonnet** when the task actually needs it. Save **50%+** on API costs.

## Rule of Thumb

> If a human would need more than 30 seconds of focused thinking, escalate.

## When to Escalate (spawn Sonnet)

### By task type

- **Analysis & evaluation** — compare options, assess trade-offs, review documents
- **Planning & strategy** — project plans, roadmaps, business models, architecture
- **Long-form writing** — reports, proposals, articles, presentations, emails > 3 paragraphs
- **Code generation** — write functions, build features, refactor, debug complex issues
- **Multi-step reasoning** — anything with "first... then... finally" or numbered steps
- **Summarize large content** — long documents, full articles, meeting transcripts
- **Long translation** — paragraphs or full documents (not single sentences)
- **Creative writing** — copywriting, ad scripts, naming with brand constraints

### By trigger words

| Language | Escalate signals |
|----------|-----------------|
| English | analyze, compare, evaluate, design, plan, build, develop, optimize, refactor, "step by step", "pros and cons", draft a proposal, write a report |
| 繁體中文 | 分析, 比較, 評估, 規劃, 設計, 幫我想, 寫一篇, 草擬, 建立, 實作, 優化, 有什麼辦法, 怎樣比較好, 深入說明, 解決方案, 幫忙看一下, 可以幫我...嗎, 該怎麼辦, 總結這份 |
| 日本語 | 分析して, 比較して, 計画を立てて, 設計して, 作成して, 書いて, 詳しく説明して, ステップバイステップ, 提案書, 解決方法 |
| 한국어 | 분석해줘, 비교해줘, 계획 세워줘, 설계해줘, 작성해줘, 만들어줘, 자세히 설명해줘, 단계별로 |

### By complexity signals

- Prompt is longer than 200 characters with specific requirements
- Contains multiple conditions or constraints
- Asks for structured output (tables, outlines, formatted documents)
- Professional context: proposal, presentation, resume, contract

## When to Stay on Haiku

- **Factual Q&A** — "what is X", "who is Y", "when did Z happen"
- **Quick lookups** — definitions, short translations (single sentences), unit conversions
- **Memory & reminders** — "remember this", "remind me to..."
- **Casual conversation** — greetings, small talk, jokes
- **Status checks** — "what's on my calendar", simple file reads
- **One-liner tasks** — anything answerable in 1-2 sentences

| Language | Stay signals |
|----------|-------------|
| English | what is, who is, define, translate, summarize briefly, tell me, yes or no |
| 繁體中文 | 是什麼, 查一下, 翻譯, 記住, 提醒我, 現在幾點, 天氣, 什麼意思 |
| 日本語 | とは, 教えて, 意味, 翻訳して, 簡単に説明して |
| 한국어 | 뭐야, 알려줘, 의미, 번역해줘, 간단히 설명 |

## How to Escalate

```
sessions_spawn(
  message: "<the full task description>",
  model: "anthropic/claude-sonnet-4-20250514",
  label: "<short task label>"
)
```

Return the result directly. Do NOT mention the model switch unless the user asks.

## Other providers

This skill is written for Claude (Haiku + Sonnet). Swap model names for other providers:

| Role | Claude | OpenAI | Google |
|------|--------|--------|--------|
| Cheap (default) | `claude-3-5-haiku` | `gpt-4o-mini` | `gemini-flash` |
| Strong (escalate) | `claude-sonnet-4` | `gpt-4o` | `gemini-pro` |

---

*小安 Ann Agent — Taiwan 台灣*
*Building skills for all AI agents, everywhere.*
*為所有 AI Agent 打造技能，不限平台。*
