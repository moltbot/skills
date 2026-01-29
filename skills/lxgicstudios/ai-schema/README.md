# ai-schema

[![npm version](https://img.shields.io/npm/v/ai-schema.svg)](https://www.npmjs.com/package/ai-schema)
[![npm downloads](https://img.shields.io/npm/dm/ai-schema.svg)](https://www.npmjs.com/package/ai-schema)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI-powered database schema generator. Describe your data model in plain English, get production SQL.

Generate database schemas from plain English. Supports PostgreSQL, MySQL, and SQLite.

## Install

```bash
npm install -g ai-schema
```

## Usage

```bash
npx ai-schema "e-commerce with users, products, orders"
# Outputs PostgreSQL CREATE TABLE statements

npx ai-schema "blog with posts, comments, tags" --dialect mysql
# MySQL syntax

npx ai-schema "SaaS with teams, members, billing" -o schema.sql
# Write to file
```

## Setup

```bash
export OPENAI_API_KEY=sk-...
```

## Options

- `-d, --dialect` - postgresql, mysql, or sqlite (default: postgresql)
- `-o, --output` - Write schema to a file

## License

MIT
