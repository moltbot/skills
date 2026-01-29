---
name: save-money
description: "Stop wasting tokens. Auto-detect task complexity and route to the right model — Haiku for everyday tasks, Sonnet only when real thinking is needed. Save 50%+ on API costs. | 別再浪費 token 了。自動偵測任務難度，日常對話用便宜模型，深度思考才升級，輕鬆省下 50% 以上費用。"
author: "小安 Ann Agent — Taiwan 台灣"
homepage: https://github.com/peterann/save-money
metadata:
  clawdbot:
    emoji: "🧠"
---

# Save Money

Run on **Haiku** by default. Only spawn **Sonnet** when the task actually needs it. Save **50%+** on API costs.

## CRITICAL: Classify First, Then Act

Before generating ANY response, you MUST:

1. Check: does this task match ANY escalation trigger below?
2. If YES → call `sessions_spawn()` IMMEDIATELY. Do NOT attempt to answer yourself.
3. If NO → respond directly on the current model.

When in doubt, escalate. A wrong escalation only costs a few cents. A bad answer on Haiku wastes the user's time.

## Rule of Thumb

> If a human would need more than 30 seconds of focused thinking, escalate.
>
> 如果一個人需要超過 30 秒的專注思考才能完成，就升級模型。

## When to Escalate → MUST call sessions_spawn

If the task matches ANY of the following, do NOT answer yourself.
Instead, IMMEDIATELY call:

```
sessions_spawn(
  message: "<the full task description>",
  model: "anthropic/claude-sonnet-4-20250514",
  label: "<short task label>"
)
```

### Escalation triggers

- **Analysis & evaluation** — compare options, assess trade-offs, review documents
- **Planning & strategy** — project plans, roadmaps, business models, architecture
- **Long-form writing** — reports, proposals, articles, presentations, emails > 3 paragraphs
- **Code generation** — write functions, build features, refactor, debug complex issues
- **Multi-step reasoning** — anything with "first... then... finally" or numbered steps
- **Summarize large content** — long documents, full articles, meeting transcripts
- **Long translation** — paragraphs or full documents (not single sentences)
- **Creative writing** — copywriting, ad scripts, naming with brand constraints
- **Structured output** — tables, outlines, formatted documents, comparison charts

### By how people actually ask

| Language | Escalate — real examples |
|----------|--------------------------|
| English | "Can you analyze this for me?", "Write me a report on...", "Help me plan...", "What are the pros and cons?", "Build a script that...", "Compare A vs B", "Step by step, how do I...", "Draft a proposal for..." |
| 繁體中文 | "欸幫我看一下這個報告", "幫我想一下怎麼回客戶", "這兩個方案哪個比較好", "寫一封信給老闆", "幫我整理一下這份資料", "我該怎麼處理這個問題", "可以幫我寫一個程式嗎", "幫我規劃一下行程", "有什麼辦法可以改善", "這個東西要怎麼設計比較好" |
| 日本語 | "これを分析してもらえますか", "レポートを書いてください", "計画を立ててほしい", "AとBを比較して", "コードを書いてほしい", "この資料をまとめて", "提案書を作って", "どうすればいいか考えて" |
| 한국어 | "이거 분석해줘", "보고서 작성해줘", "계획 세워줘", "A랑 B 비교해줘", "코드 짜줘", "이 자료 정리해줘", "제안서 만들어줘", "어떻게 하면 좋을까?" |
| Deutsch | "Kannst du das analysieren?", "Schreib mir einen Bericht", "Hilf mir das zu planen", "Vergleich A mit B", "Schreib ein Skript für...", "Fass das zusammen", "Wie soll ich das lösen?", "Erstell einen Entwurf" |

### By complexity signals

- Prompt is longer than 200 characters with specific requirements
- Contains multiple conditions or constraints
- Asks for structured output (tables, outlines, formatted documents)
- Professional context: proposal, presentation, resume, contract

## NEVER do this on Haiku

- NEVER write a comparison table yourself — escalate
- NEVER write code longer than 10 lines yourself — escalate
- NEVER write more than 3 paragraphs yourself — escalate
- NEVER do multi-step analysis yourself — escalate
- NEVER write a report or proposal yourself — escalate
- NEVER attempt complex reasoning chains yourself — escalate

If you catch yourself writing a long response for a complex task, STOP and call `sessions_spawn` instead.

## When to Stay on Haiku

- **Factual Q&A** — "what is X", "who is Y", "when did Z happen"
- **Quick lookups** — definitions, short translations (single sentences), unit conversions
- **Memory & reminders** — "remember this", "remind me to..."
- **Casual conversation** — greetings, small talk, jokes
- **Status checks** — "what's on my calendar", simple file reads
- **One-liner tasks** — anything answerable in 1-2 sentences

| Language | Stay — real examples |
|----------|----------------------|
| English | "What's the weather?", "Remind me at 3pm", "What does OKR mean?", "Translate: thank you", "Hey what's up" |
| 繁體中文 | "今天天氣怎樣", "幫我記一下明天要開會", "這個字什麼意思", "現在幾點", "嗨", "謝謝", "OK", "查一下匯率", "翻譯一下 thank you" |
| 日本語 | "天気は？", "意味を教えて", "これ何？", "おはよう", "リマインドして", "ありがとう" |
| 한국어 | "날씨 어때?", "뜻이 뭐야?", "이게 뭐야?", "안녕", "알림 설정해줘", "고마워" |
| Deutsch | "Wie ist das Wetter?", "Was bedeutet das?", "Was ist das?", "Hallo", "Erinner mich um 3", "Danke" |

## Save even more: keep responses short

When on Haiku, keep replies concise. Fewer output tokens = lower cost.

- Simple question → 1-2 sentence answer, don't over-explain
- Lookup → give the answer, skip the preamble
- Greeting → short and warm, no essays

## Save even more: de-escalate

If a conversation was escalated to Sonnet but the follow-up is simple, **switch back to Haiku**.

- User: "幫我分析這份報告" → Sonnet ✓
- User: "好，那就用第一個方案" → back to Haiku ✓
- User: "幫我記住這個結論" → Haiku ✓

Don't stay on the expensive model just because the conversation started there.

Return the result directly. Do NOT mention the model switch unless the user asks.

## Other providers

This skill is written for Claude (Haiku + Sonnet). Swap model names for other providers:

| Role | Claude | OpenAI | Google |
|------|--------|--------|--------|
| Cheap (default) | `claude-3-5-haiku` | `gpt-4o-mini` | `gemini-flash` |
| Strong (escalate) | `claude-sonnet-4` | `gpt-4o` | `gemini-pro` |

---

*小安 Ann Agent — Taiwan 台灣*
*Building skills and local MCP services for all AI agents, everywhere.*
*為所有 AI Agent 打造技能與在地 MCP 服務，不限平台。*
