# ai-eslint-config

Generate an ESLint config that matches your codebase's existing style. No more arguing about semicolons.

## Install

```bash
npm install -g ai-eslint-config
```

## Usage

```bash
npx ai-eslint-config
# → ESLint config written to eslint.config.js

npx ai-eslint-config --format json
# → Generates .eslintrc.json instead

npx ai-eslint-config --dir ./src
# → Only analyze files in ./src
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## License

MIT
