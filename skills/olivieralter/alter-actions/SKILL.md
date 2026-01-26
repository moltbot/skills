---
name: alter-action-trigger
description: Trigger Alter macOS app actions via x-callback-urls. Catalog of 84+ actions including ask-anything, translate, summarize, grammar correction, and more.
metadata: {"clawdbot":{"requires":{"os":["darwin"]},"emoji":"🌀"}}
user-invocable: true
homepage: https://alterhq.com/blog/alter-callback-urls-guide
---

# Alter Action Trigger

Trigger Alter actions via x-callback-urls from Clawdbot or the command line.

## Quick Start

```bash
# Trigger an action directly
node index.js trigger ask-anything --input "What is AI?"

# Find actions with natural language
node index.js find "summarize video"

# List all actions in a category
node index.js list --category writing
```

## URL Format

All Alter actions use the x-callback-url format:
```
alter://action/{action-id}?input={encoded-text}&param={value}
```

## Functions

### `triggerAction(actionId, input, params)`
Triggers an Alter action via x-callback-url.

### `findActions(query)`
Finds actions matching a natural language query.

### `listActions(category)`
Lists all actions, optionally filtered by category.

### `getActionInfo(actionId)`
Returns detailed information about a specific action.

### `buildCallbackUrl(actionId, input, params)`
Builds an x-callback-url without executing it.

---

## Available Actions Reference

### 📝 Writing Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `analyze-prose` | Analyze Prose | Evaluates writing for quality with ratings and recommendations | None |
| `aphorisms` | Aphorisms | Finds and prints existing, known aphorisms | None |
| `change-tone` | Change the Tone | Changes text tone while preserving meaning | `tone`: Assertive, Friendly, Informal, Professional, Simple and direct |
| `correct-grammar` | Correct Grammar & Spelling | Fixes grammar and spelling errors | None |
| `cut-filler-words` | Cut filler words | Removes filler words for confident text | None |
| `fill-in` | Fill in | Completes partial text intelligently | None |
| `improve-writing` | Improve Writing | Refines text for clarity, coherence, grammar | None |
| `lengthen` | Lengthen | Expands text with additional details | None |
| `poll` | Poll | Generates engaging polls | None |
| `rewrite` | Rewrite | Rewrites text with fresh perspectives | None |
| `shorten` | Shorten | Condenses text while retaining essentials | None |
| `write-essay` | Write essay | Crafts well-structured essays | `input`: Topic/Instructions |

### 💻 Code Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `act-code` | Act On Code | Modifies and improves code | `input`: Instructions |
| `document` | Document code | Documents code with comments | None |
| `explain-code` | Explain Code | Explains code and documentation | None |
| `fill-code` | Fill Code | Fills in missing code | None |
| `fix-code` | Fix Code | Fixes code errors | `input`: Error message |
| `language-gpt` | Language-GPT | Expert insights for programming languages | `input`: Question |
| `suggest-improvements` | Suggest code improvements | Analyzes code for enhancements | None |
| `transcode` | Transcode to other language | Converts code between languages | `language`: Target language |

### 🌐 Translation Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `translate` | Translate | Translates text between languages | `language`: Arabic, Chinese, Dutch, English, Filipino, French, German, Indonesian, Italian, Japanese, Korean, Portuguese, Russian, Spanish, Vietnamese |
| `translate-to-english` | Translate to English | Translates any language to English | None |
| `translate-to-french` | Translate to French | Translates any language to French | None |
| `translate-to-spanish` | Translate to Spanish | Translates any language to Spanish | None |

### 📊 Summarize Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `summarize-detailed` | Detailed | Comprehensive summary with overview, points, takeaways | None |
| `summarize-micro` | Micro | Concise, focused summaries | None |
| `summarize-newsletter` | Newsletter Summary | Extracts key newsletter updates | None |

### 🔍 Extract Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `extract-mails` | Mails | Extracts email addresses | None |
| `extract-names` | Names | Extracts personal names | None |
| `extract-any` | People/Companies | Extracts personal/business info | None |
| `extract-predictions` | Predictions | Extracts predictions | None |
| `extract-recommendations` | Recommendations | Extracts recommendations | None |
| `extract-todo` | Tasks | Extracts actionable tasks | None |
| `extract-trends` | Trends | Extracts trends | None |
| `extract-wisdom` | Extract Wisdom | Extracts insights and interesting info | None |

### 📋 Format Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `format-to-bullet-list` | Bullet list | Converts text to bullet list | None |
| `format-to-markdown-checklist` | Markdown checklist | Converts text to checklist | None |
| `format-to-markdown-table` | Markdown table | Converts text to table | None |
| `format-to-numbered-list` | Numbered list | Converts text to numbered list | None |
| `sort-az` | Sort A-Z | Sorts alphabetically ascending | None |
| `sort-za` | Sort Z-A | Sorts alphabetically descending | None |

### 🎨 Create Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `create-alter-action` | Alter Action | Creates Alter Actions | `input`: Instructions |
| `create-charts` | Charts | Creates Recharts visualizations | `input`: Instructions |
| `create-diagrams` | Diagrams | Generates Mermaid diagrams | `input`: Instructions |
| `create-html` | HTML page | Creates HTML pages | `input`: Instructions |
| `create-images` | Images | Generates AI images (Flux, Ideogram) | `input`: Instructions |
| `create-maps` | Maps | Creates LeafletJS maps | `input`: Instructions |
| `create-presentations` | HTML Presentations | Generates slide presentations | `input`: Instructions |
| `create-react-app` | Tailwind React App | Creates React apps | `input`: Instructions |

### 🔎 Explain Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `analyze-paper` | Analyze Paper | Analyzes research papers | None |
| `explain-selection` | Explain | Explains complex concepts simply | None |
| `hidden-message` | Hidden message | Uncovers hidden messages in text | None |

### 🔀 Git Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `git-commit` | Commit message | Generates commit messages | None |
| `git-review` | Review | Reviews code changes | None |
| `git-summarize` | Summarize | Summarizes Git commits | None |
| `pull-request` | Pull Request | Creates PR descriptions | None |

### 🧠 Co-Intelligence Actions (Expert GPTs)

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `business-strategist-gpt` | Business Strategy Expert | Business strategy advice | `input`: Question |
| `children-educator` | Children Educator | Early childhood education guidance | `input`: Question |
| `e-commerce-strategist-gpt` | E-commerce Strategy Expert | E-commerce strategy advice | `input`: Question |
| `hrmanager-gpt` | HR Manager Expert | HR management guidance | `input`: Question |
| `marketer-gpt` | Marketing Expert | Marketing strategy advice | `input`: Question |
| `mental-models-gpt` | Mental Models Expert | Mental models for decision-making | `input`: Question |
| `software-architect-gpt` | Software Architect Expert | Software architecture guidance | `input`: Question |

### 💬 General Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `ask-anything` | Ask Anything | Open-ended AI conversation | `input`: Instructions |
| `ask-web` | Search the web | Web search with sources | `input`: Question |

### 📧 Email Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `mail-draft` | Mail Draft | Creates email drafts | `input`: Instructions |
| `mail-multi-summary` | Multiconversation summary | Summarizes multiple email threads | None |
| `mail-reply` | Mail Reply | Generates email replies | `answerType`: Any updates?, Doesn't work, I don't know, etc. |
| `mail-summary` | Thread summary | Summarizes email threads | None |

### 📱 Social Media Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `linkedin-post` | Linkedin Post | Creates LinkedIn posts | None |
| `linkedin-reply` | Linkedin Reply | Generates LinkedIn replies | None |
| `twitter-post` | Twitter Post | Creates engaging tweets | None |
| `twitter-reply` | Twitter Reply | Generates tweet replies | None |
| `twitter-thread` | Twitter Thread | Creates Twitter threads | None |

### 📺 YouTube Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `youtube-hidden-message` | Youtube hidden message | Analyzes videos for hidden messages | None |
| `youtube-summarize-detailed` | Youtube detailed Summary | Comprehensive video summaries | None |
| `youtube-summarize-micro` | Youtube micro summary | Quick video summaries | None |

### 🎯 Other Actions

| Action ID | Name | Description | Parameters |
|-----------|------|-------------|------------|
| `create-a-keynote-deck` | Generate Keynote slides | Generates Keynote presentations | `input`: Instructions |
| `edit-a-keynote-deck` | Edit Keynote slide | Edits Keynote slides | `input`: Instructions |
| `translate-the-deck` | Translate the deck | Translates Keynote presentations | `language`: Target language |
| `write-presenter-notes` | Write presenter notes | Creates presenter notes | None |
| `meeting-scribe` | Meeting Report | Converts transcripts to notes | None |
| `spreadsheet-formula` | Spreadsheet Formula | Creates spreadsheet formulas | `input`: Instructions |
| `user-story` | User Story | Creates agile user stories | None |

---

## Categories

| Category | Description | Action Count |
|----------|-------------|--------------|
| `code` | Programming and development | 8 |
| `writing` | Text editing and creation | 12 |
| `translate` | Language translation | 4 |
| `summarize` | Content summarization | 2 |
| `extract` | Information extraction | 7 |
| `format` | Text formatting | 6 |
| `create` | Content creation | 8 |
| `explain` | Explanation and analysis | 4 |
| `git` | Git version control | 4 |
| `co-intelligences` | Expert AI assistants | 7 |

---

## Usage Examples

### From Clawdbot

```javascript
// Trigger ask-anything with a question
const { triggerAction } = require('./index.js');
triggerAction('ask-anything', 'What is machine learning?');

// Find actions for "translate text"
const { findActions } = require('./index.js');
const matches = findActions('translate text');
console.log(matches[0]); // { id: 'translate', name: 'Translate', ... }

// Build URL without triggering
const { buildCallbackUrl } = require('./index.js');
const url = buildCallbackUrl('translate', null, { language: 'French' });
// -> alter://action/translate?language=French
```

### From Command Line

```bash
# Ask a question
node index.js trigger ask-anything --input "Explain quantum computing"

# Translate with specific language
node index.js trigger translate --param "language=Japanese"

# Fix code with error message
node index.js trigger fix-code --input "TypeError: undefined is not a function"

# Change tone
node index.js trigger change-tone --param "tone=Professional"

# Search for actions
node index.js find "create a chart"

# Get action details
node index.js info create-images
```

---

## Notes

- Actions operate on currently selected text/files in Alter
- Parameters are URL-encoded automatically
- Actions with `hasParameters: false` typically need selected content in Alter
- The `open` command is used on macOS to trigger x-callback-urls
