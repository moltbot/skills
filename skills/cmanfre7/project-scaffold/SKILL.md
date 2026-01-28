# project-scaffold

Scaffold new projects with best-practice structure, tooling, and configuration.

## Usage

When Colt (or you) needs to start a new project, use this skill to generate the full boilerplate.

## Decision Tree

Ask or infer the project type:

### Web App (React / Next.js)
```
my-app/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utilities, helpers, API clients
│   ├── styles/           # Global styles, Tailwind config
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
├── tests/                # Test files
├── .gitignore
├── .eslintrc.json
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

**Init commands:**
```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir
cd my-app && npm install
```

### API / Backend (FastAPI)
```
my-api/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app entry
│   ├── routers/          # Route modules
│   ├── models/           # Pydantic models / DB models
│   ├── services/         # Business logic
│   └── config.py         # Settings / env vars
├── tests/
├── .gitignore
├── pyproject.toml
├── requirements.txt
└── README.md
```

**Init commands:**
```bash
mkdir my-api && cd my-api
uv init && uv pip install fastapi uvicorn
```

### Mobile App (SwiftUI)
```
MyApp/
├── MyApp/
│   ├── App.swift
│   ├── ContentView.swift
│   ├── Models/
│   ├── Views/
│   ├── ViewModels/
│   └── Services/
├── MyAppTests/
├── MyAppUITests/
└── README.md
```

**Init:** Use Xcode or `swift package init --type executable`

### CLI Tool (Node / Python)
```
my-cli/
├── src/
│   └── index.ts          # Entry point
├── bin/
│   └── my-cli            # Executable wrapper
├── tests/
├── .gitignore
├── tsconfig.json
├── package.json
└── README.md
```

### Browser Extension
```
my-extension/
├── src/
│   ├── background.ts
│   ├── content.ts
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   └── options/
├── icons/
├── manifest.json
├── .gitignore
├── tsconfig.json
├── package.json
└── README.md
```

## Post-Scaffold Checklist

After generating structure:
1. `git init && git add -A && git commit -m "Initial scaffold"`
2. Create `.gitignore` appropriate to the project type
3. Set up linting config (ESLint / Ruff)
4. Add a basic README with project name and setup instructions
5. Add a basic test file to verify the test runner works

## Asset Templates

### .gitignore (universal base)
```
node_modules/
__pycache__/
.env
.env.local
dist/
build/
.next/
*.pyc
.DS_Store
*.log
coverage/
```
