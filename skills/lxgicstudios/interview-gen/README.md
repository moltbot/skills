# ai-interview

Generate interview questions tailored to your actual codebase. Great for hiring people who'll work on your specific stack.

## Install

```bash
npm install -g ai-interview
```

## Usage

```bash
npx ai-interview ./src/
# → 10 mid-level questions based on your code

npx ai-interview ./src/ --level senior --count 15
# → 15 senior-level questions

npx ai-interview ./src/ -o questions.md
# → Save to file
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## Options

- `-l, --level` - junior, mid, or senior (default: mid)
- `-n, --count` - Number of questions (default: 10)
- `-o, --output` - Save questions to a file

## License

MIT
