# ai-env-sync

Generate .env.example from your .env files. Strips secrets, adds helpful comments.

## Install

```bash
npm install -g ai-env-sync
```

## Usage

```bash
npx ai-env-sync
# Reads .env, .env.local, etc. and generates .env.example

npx ai-env-sync ./my-project
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```
