# Code Docs Search by Exa

Up-to-date code docs and examples for AI, powered by Exa. Finds real code snippets and docs from GitHub, docs sites, and Stack Overflow.

## Setup
Connect MCP server:
`https://mcp.exa.ai/mcp`

No API key needed.

## Tool
`get_code_context_exa`

## What it does
Finds real code snippets and docs from GitHub, docs sites, and Stack Overflow.
Great for correct syntax, setup guides, and usage examples.

## Inputs
- `query` (string, required): What code or doc you want to find.
- `tokensNum` (string or int, optional): How much context to return.
  Use `dynamic` for auto length, or a number like `10000`. `dynamic` is recommended.

## Examples
Basic:
```
get_code_context_exa { "query": "React useState example" }
```

More context:
```
get_code_context_exa {
  "query": "Current Next.js app router with TypeScript setup",
  "tokensNum": 8000
}
```

Shorter output:
```
get_code_context_exa {
  "query": "pandas groupby examples",
  "tokensNum": 2000
}
```

## When to Use
- Finding correct syntax for a library or SDK
- Getting real code examples for a feature
- Reviewing setup steps or best practices

## Notes
- Ask for specific versions to improve accuracy.
- Larger `tokensNum` returns more context but costs more.

## References
- Exa MCP: https://exa.ai/docs/reference/exa-mcp
- Exa Code (Context API): https://docs.exa.ai/reference/context
