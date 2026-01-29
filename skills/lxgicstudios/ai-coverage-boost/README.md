# ai-coverage-boost

Find untested code paths and auto-generate tests. Point it at a file and get instant coverage improvements.

## Install

```bash
npm install -g ai-coverage-boost
```

## Usage

```bash
npx ai-coverage-boost ./src/utils.ts
# → Found 4 untested paths
# → Tests written to ./src/utils.test.ts

npx ai-coverage-boost ./src/utils.ts --dry-run
# → Shows uncovered paths without writing files

npx ai-coverage-boost ./src/utils.ts -o ./tests/utils.test.ts
# → Custom output path
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## License

MIT
