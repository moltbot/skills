# Signal Detection Patterns

Comprehensive reference for detecting correction signals and learning opportunities in conversations.

## Confidence Levels

### HIGH Confidence (Explicit Corrections)

These patterns indicate the user is explicitly stating a rule or correction. Always apply these learnings.

#### Negative Directives

| Pattern | Type | Example |
|---------|------|---------|
| `never` | correction | "Never use var in TypeScript" |
| `don't` / `do not` | correction | "Don't commit directly to main" |
| `stop doing` | correction | "Stop doing manual deployments" |
| `wrong` | correction | "That's wrong, use snake_case" |
| `not like that` | correction | "Not like that, indent with tabs" |
| `incorrect` | correction | "That's incorrect syntax" |
| `should not` / `shouldn't` | prohibition | "You shouldn't use eval()" |
| `must not` / `mustn't` | prohibition | "Must not expose secrets" |

**Regex Pattern:**
```regex
\b(never|don't|do not|stop doing|wrong|not like that|incorrect|should not|shouldn't|must not|mustn't)\b
```

#### Positive Directives

| Pattern | Type | Example |
|---------|------|---------|
| `always` | requirement | "Always validate inputs" |
| `must` | requirement | "You must use parameterized queries" |
| `required` | requirement | "It's required to have tests" |
| `the rule is` | explicit_rule | "The rule is no console.log in prod" |
| `correct way` | explicit_rule | "The correct way is to use hooks" |

**Regex Pattern:**
```regex
\b(always|must|required|the rule is|correct way)\b
```

#### Frustration Markers

These indicate repeated corrections - highest priority learnings.

| Pattern | Type | Example |
|---------|------|---------|
| `I already told you` | frustration | "I already told you about this" |
| `again?` | frustration | "Wrong again?" |
| `not again` | frustration | "Oh not again" |
| `how many times` | frustration | "How many times do I need to say..." |

**Regex Pattern:**
```regex
(I already told you|again\?|not again|how many times)
```

#### Explicit Rules

| Pattern | Type | Example |
|---------|------|---------|
| `the rule is` | explicit_rule | "The rule is we use ESLint" |
| `you should know` | explicit_rule | "You should know we use Prettier" |
| `remember that` | explicit_rule | "Remember that we're on Node 20" |
| `don't forget` | explicit_rule | "Don't forget the error handling" |

**Regex Pattern:**
```regex
(the rule is|you should know|remember that|don't forget)
```

### MEDIUM Confidence (Approved Approaches)

These patterns indicate the user approved a specific approach. Apply with reasonable confidence.

#### Approval Markers

| Pattern | Type | Example |
|---------|------|---------|
| `perfect` | approval | "Perfect, that's what I wanted" |
| `exactly` | approval | "Exactly right" |
| `that's right` | approval | "That's right, keep it" |
| `yes, like that` | approval | "Yes, like that" |
| `correct` | approval | "Correct implementation" |

**Regex Pattern:**
```regex
\b(perfect|exactly|that's right|yes, like that|correct)\b
```

#### Positive Feedback

| Pattern | Type | Example |
|---------|------|---------|
| `good` | positive_feedback | "Good approach" |
| `great job` | positive_feedback | "Great job on the refactor" |
| `well done` | positive_feedback | "Well done with the tests" |
| `nice` | positive_feedback | "Nice solution" |
| `excellent` | positive_feedback | "Excellent work" |

**Regex Pattern:**
```regex
\b(good|great job|well done|nice|excellent)\b
```

#### Continuation Markers

| Pattern | Type | Example |
|---------|------|---------|
| `keep doing` | continuation | "Keep doing it this way" |
| `continue with` | continuation | "Continue with this approach" |
| `stick with` | continuation | "Stick with React hooks" |

**Regex Pattern:**
```regex
\b(keep doing|continue with|stick with)\b
```

### LOW Confidence (Observations)

These patterns suggest preferences but require validation before encoding as rules.

#### Suggestions

| Pattern | Type | Example |
|---------|------|---------|
| `maybe` | suggestion | "Maybe try TypeScript" |
| `perhaps` | suggestion | "Perhaps use a different library" |
| `might want to` | suggestion | "You might want to add caching" |
| `consider` | suggestion | "Consider using memoization" |

**Regex Pattern:**
```regex
\b(maybe|perhaps|might want to|consider)\b
```

#### Observations

| Pattern | Type | Example |
|---------|------|---------|
| `seems like` | observation | "Seems like this works" |
| `appears to` | observation | "Appears to be faster" |
| `looks like` | observation | "Looks like a good pattern" |

**Regex Pattern:**
```regex
\b(seems like|appears to|looks like)\b
```

## Category Detection

### Code Style

Patterns indicating code style preferences:

```regex
\b(naming|convention|style|format|indent|case|camelCase|snake_case|PascalCase)\b
\b(variable|function|class|method|parameter)\s+name
\b(semicolon|quote|single quote|double quote|tabs|spaces)\b
```

Examples:
- "Use snake_case for Python variables"
- "We prefer single quotes for strings"
- "Indent with 2 spaces, not tabs"

### Architecture

Patterns indicating architectural decisions:

```regex
\b(pattern|architecture|design|structure|module|component|service)\b
\b(separation|coupling|cohesion|dependency|layer|abstraction)\b
\b(microservice|monolith|serverless|event-driven)\b
```

Examples:
- "Use dependency injection for services"
- "Keep components loosely coupled"
- "Follow the repository pattern"

### Process

Patterns indicating workflow preferences:

```regex
\b(workflow|process|step|procedure|protocol|practice)\b
\b(commit|branch|merge|review|deploy|test|ci|cd)\b
\b(pr|pull request|code review|approval)\b
```

Examples:
- "Always run tests before commit"
- "Use conventional commits"
- "Squash commits on merge"

### Domain

Patterns indicating business logic:

```regex
\b(business|domain|logic|rule|requirement|constraint)\b
\b(customer|user|client|account|order|payment|invoice)\b
\b(validate|verify|check|ensure|confirm)\b
```

Examples:
- "Orders must be validated before processing"
- "Users need email verification"
- "Payments require two-factor auth"

### Tools

Patterns indicating tool preferences:

```regex
\b(tool|cli|command|terminal|shell|editor|ide)\b
\b(git|npm|yarn|pnpm|docker|kubernetes)\b
\b(config|setting|environment|variable|env)\b
```

Examples:
- "Use pnpm instead of npm"
- "Configure ESLint with these rules"
- "Run Docker in production"

### New Skill

Patterns indicating skill-worthy discoveries:

```regex
\b(workaround|trick|hack|solution|fix|debug|resolve)\b
\b(error|bug|issue|problem)\s+(was|is|fixed|solved|resolved)\b
(took|spent)\s+\d+\s*(min|minute|hour|day)
\b(finally|after trying|turns out|the issue was)\b
```

Examples:
- "The workaround is to clear the cache first"
- "After 2 hours debugging, found the issue was..."
- "Turns out the error message was misleading"

## Edge Cases

### False Positives to Avoid

Some patterns may match but don't indicate learnings:

- Rhetorical questions: "Why would you never do X?" (not a directive)
- Hypotheticals: "If you never use Y, then..." (conditional)
- Quotes/references: "The docs say never..." (not user's directive)
- Negations: "It's not wrong to..." (opposite meaning)

### Context Sensitivity

Consider surrounding context:

- "That's not wrong" - NOT a correction
- "That's not right" - IS a correction
- "Never mind" - NOT a directive about future behavior
- "Always" in a loop - NOT a behavioral directive

## Combining Patterns

When multiple patterns match:

1. Use the highest confidence pattern
2. If equal confidence, use the most specific category
3. Prefer explicit rules over implied preferences
4. Prioritize frustration markers (indicate repeated issue)

## Implementation Notes

The `signal_detector.py` script implements these patterns. To update patterns:

1. Add pattern to appropriate `*_PATTERNS` list
2. Run `python signal_detector.py --test` to verify
3. Add test case for new pattern
4. Update this documentation
