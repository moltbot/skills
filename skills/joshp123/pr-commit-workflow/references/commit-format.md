# Commit Message Format

## Requirements
- Prefix with 🤖.
- Use multi-line message: subject + what/why + tests.
- Prefer heredoc over `-m` to avoid quoting errors.

## Template
Subject line:
- `🤖 <type>: <short summary>`

Body:
- `What: <bullet list>`
- `Why: <bullet list>`
- `Tests: <command + result>`

## Example (heredoc)
```
git commit -F - <<'MSG'
🤖 docs: clarify PR workflow expectations

What:
- add explicit human-written intent requirement
- split commit/PR sections in workflow skill

Why:
- enforce reviewer context and transparency
- reduce PR churn from auto-generated summaries

Tests:
- not run (docs-only)
MSG
```

## Multi-Model Attribution
If multiple models contributed, add Co-Authored-By trailers:
```
Co-Authored-By: GPT-5.2-Codex <noreply@openai.com>
Co-Authored-By: Gemini Pro <noreply@google.com>
```
