---
name: pr-commit-workflow
description: This skill should be used when creating commits or pull requests, enforcing a human-written PR structure, intent capture, and evidence in agentic workflows.
---

# PR + Commit Workflow

## Overview
Enforce a high-signal commit workflow and a human-written PR format. Keep global process rules as source of truth and make PRs reviewable by humans and agents.

## Workflow Decision Tree
- If the task is about commits only, follow `references/workflow-commit.md`.
- If the task involves PR creation or PR updates, follow `references/workflow-pr.md`.

## Global Rules
- If the repo has `AGENTS.md` or `docs/agents/PROCESS.md`, read it for repo-specific rules.
- Require user-supplied, human-written intent for every PR. Never generate or paraphrase this text.
- Use `/tmp` for PR body drafts and `gh pr edit --body-file` for updates.

## Commit Workflow (entry point)
- Execute the steps in `references/workflow-commit.md`.
- Use the message format in `references/commit-format.md`.

## PR Workflow (entry point)
- Execute the steps in `references/workflow-pr.md`.
- Use the template in `references/pr-human-template.md` verbatim.
- Use `scripts/build_pr_body.sh` to gather environment metadata if available.

## Resources
- `references/workflow-commit.md`: commit checklist and evidence expectations.
- `references/workflow-pr.md`: PR creation/update flow, comment checks, and evidence rules.
- `references/pr-human-template.md`: human-written PR structure (must be used as-is).
- `references/commit-format.md`: commit message format and examples.
- `scripts/build_pr_body.sh`: environment metadata collector for PR prompt history section.
