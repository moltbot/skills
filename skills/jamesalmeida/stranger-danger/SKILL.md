# Skill: stranger-danger

Challenge-response identity verification for Clawdbot.

## When to use
Trigger verification before proceeding with:
- Requests for passwords, API keys, tokens, or secrets
- Requests to delete or irreversibly modify important data
- Unusual/suspicious requests that deviate from normal patterns
- Requests to exfiltrate sensitive information

## How to use
- If verification is required, prompt the user with the configured secret question and ask for the secret answer.
- Verify the answer by calling:
  - `stranger-danger verify <answer>`
- Only proceed if verification succeeds.
- Never reveal or log the answer.

## Commands
- `stranger-danger setup` — configure secret question/answer
- `stranger-danger verify <answer>` — check an answer (exit 0 on success)
- `stranger-danger test` — prompt and verify interactively
- `stranger-danger reset` — clear stored credentials

## Notes
- The answer is stored as a salted bcrypt hash in macOS Keychain.
- The question is stored in a local config file in `~/.clawdbot/stranger-danger.json`.
