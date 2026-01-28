# ai-refactor

Point it at a file and get refactoring suggestions with colored diffs. Like having a code review buddy who doesn't get tired.

## Install

```bash
npm install -g ai-refactor
```

## Usage

```bash
# See suggestions
npx ai-refactor src/utils.ts

# Apply changes directly
npx ai-refactor src/utils.ts --apply

# Focus on something specific
npx ai-refactor src/api.ts --focus "error handling"
```

## Setup

```bash
export OPENAI_API_KEY=your-key-here
```

## Options

- `--apply` - Write the refactored code back to the file
- `--focus <area>` - Zero in on a specific concern

## What it looks at

- Readability and naming
- Duplication
- Modern language patterns
- Performance gotchas
- Type safety

It won't change what your code does. Just how it's written.

## License

MIT
