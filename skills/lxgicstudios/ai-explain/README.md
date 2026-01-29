# ai-explain

[![npm version](https://img.shields.io/npm/v/ai-explain.svg)](https://www.npmjs.com/package/ai-explain)
[![npm downloads](https://img.shields.io/npm/dm/ai-explain.svg)](https://www.npmjs.com/package/ai-explain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI-powered code explainer. Get plain English explanations of any code file.

Explain any code file in plain English. Great for onboarding, code reviews, or just understanding unfamiliar code.

## Install

```bash
npm install -g ai-explain
```

## Usage

```bash
npx ai-explain ./src/app.ts
# Explains the file in beginner-friendly terms

npx ai-explain ./src/auth.ts --level expert
# More technical explanation
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## Options

- `-l, --level` - beginner, intermediate, or expert (default: beginner)

## License

MIT
