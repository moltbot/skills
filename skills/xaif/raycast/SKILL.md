---
name: raycast-extensions
description: Build and maintain Raycast extensions using the Raycast API. Triggers on @raycast/api, List, Grid, Detail, Form, AI.ask, LocalStorage, Cache, showToast, and BrowserExtension. Use this repo's references/api/*.md files as the primary source of truth for component specs and API usage.
---

# Raycast Extensions Skill

Build powerful extensions with React, TypeScript, and the Raycast API.

## Quick Start (Agent Workflow)

Follow these steps when tasked with implementing or fixing Raycast features:

1. **Identify the core component**: Determine if the UI needs a `List`, `Grid`, `Detail`, or `Form`.
2. **Consult Reference**: Open and read the corresponding file in `references/api/` (e.g., `references/api/list.md`).
3. **Use Defaults**:
    - **Feedback**: Use `showToast` for Loading/Success/Failure. Use `showHUD` only for quick background completions.
    - **Data**: Use `Cache` for frequent/transient data, `LocalStorage` for persistent user data.
    - **Access**: Always check `environment.canAccess(AI)` or `environment.canAccess(BrowserExtension)` before use.
4. **Implementation**: Provide a concise implementation using `@raycast/api` components.
5. **Citing**: Link back to the specific `references/api/*.md` file you used.

## Cookbook Patterns

### 1. List & Grid (Searchable UI)
Use `List` for text-heavy data and `Grid` for image-heavy data.
- [List Reference](references/api/list.md) | [Grid Reference](references/api/grid.md)

```tsx
<List isLoading={isLoading} searchBarPlaceholder="Search items..." throttle>
  <List.Item
    title="Item Title"
    subtitle="Subtitle"
    accessories={[{ text: "Tag" }]}
    actions={
      <ActionPanel>
        <Action.Push title="View Details" target={<Detail markdown="# Details" />} />
        <Action.CopyToClipboard title="Copy" content="value" />
      </ActionPanel>
    }
  />
</List>
```

### 2. Detail (Rich Markdown)
Use for displaying long-form content or item details.
- [Detail Reference](references/api/detail.md)

```tsx
<Detail
  isLoading={isLoading}
  markdown="# Heading\nContent here."
  metadata={
    <Detail.Metadata>
      <Detail.Metadata.Label title="Status" text="Active" icon={Icon.Checkmark} />
    </Detail.Metadata>
  }
/>
```

### 3. Form (User Input)
Always include a `SubmitForm` action.
- [Form Reference](references/api/form.md)

```tsx
<Form
  actions={
    <ActionPanel>
      <Action.SubmitForm onSubmit={(values) => console.log(values)} />
    </ActionPanel>
  }
>
  <Form.TextField id="title" title="Title" placeholder="Enter title" />
  <Form.TextArea id="description" title="Description" />
</Form>
```

### 4. Feedback & Interactivity
Prefer `showToast` for most feedback.
- [Toast Reference](references/api/toast.md) | [HUD Reference](references/api/hud.md)

```typescript
// Success/Failure
await showToast({ style: Toast.Style.Success, title: "Success!" });

// HUD (Overlay)
await showHUD("Done!");
```

### 5. Data Persistence
Use `Cache` for performance, `LocalStorage` for persistence.
- [Cache Reference](references/api/caching.md) | [Storage Reference](references/api/storage.md)

```typescript
// Cache (Sync/Transient)
const cache = new Cache();
cache.set("key", "value");

// LocalStorage (Async/Persistent)
await LocalStorage.setItem("key", "value");
```

### 6. AI & Browser Extension (Restricted APIs)
Always wrap in `environment.canAccess` checks.
- [AI Reference](references/api/ai.md) | [Browser Reference](references/api/browser-extension.md)

```typescript
if (environment.canAccess(AI)) {
  const result = await AI.ask("Prompt");
}

if (environment.canAccess(BrowserExtension)) {
  const tabs = await BrowserExtension.getTabs();
}
```

## Additional Resources

### API Reference Tree

- **UI Components**
  - [Action Panel](references/api/action-panel.md)
  - [Detail](references/api/detail.md)
  - [Form](references/api/form.md)
  - [Grid](references/api/grid.md)
  - [List](references/api/list.md)
  - [User Interface](references/api/user-interface.md)
- **Interactivity**
  - [Actions](references/api/actions.md)
  - [Alert](references/api/alert.md)
  - [Keyboard](references/api/keyboard.md)
  - [Navigation](references/api/navigation.md)
  - [Raycast Window Search Bar](references/api/raycast-window-search-bar.md)
- **Utilities & Services**
  - [AI](references/api/ai.md)
  - [Browser Extension](references/api/browser-extension.md)
  - [Clipboard](references/api/clipboard.md)
  - [Environment](references/api/environment.md)
  - [Feedback & HUD](references/api/feedback.md)
    - [HUD](references/api/hud.md)
    - [Toast](references/api/toast.md)
  - [OAuth](references/api/oauth.md)
  - [System Utilities](references/api/system-utilities.md)
- **Data & Configuration**
  - [Caching](references/api/caching.md)
  - [Colors](references/api/colors.md)
  - [Icons & Images](references/api/icons-images.md)
  - [Preferences](references/api/preferences.md)
  - [Storage](references/api/storage.md)
- **Advanced**
  - [Command Related Utilities](references/api/command-related-utilities.md)
  - [Menu Bar Commands](references/api/menu-bar-commands.md)
  - [Tool](references/api/tool.md)
  - [Window Management](references/api/window-management.md)

## Examples

For end-to-end examples combining multiple components and APIs, see [examples.md](examples.md).
