# Raycast Extension Examples

This file contains end-to-end examples for common Raycast extension workflows.

## Fetch, Cache, and List

A common pattern for extensions that fetch data from an API.

```tsx
import { List, ActionPanel, Action, Cache, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";

const cache = new Cache();

export default function Command() {
  const { isLoading, data, revalidate } = useFetch("https://api.example.com/items", {
    onWillExecute: () => {
      const cached = cache.get("items");
      if (cached) return JSON.parse(cached);
    },
    onData: (data) => {
      cache.set("items", JSON.stringify(data));
    },
    onError: (error) => {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch items",
        message: error.message,
      });
    },
  });

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search items...">
      {data?.map((item: any) => (
        <List.Item
          key={item.id}
          title={item.name}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={item.url} />
              <Action title="Reload" onAction={revalidate} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
```

## AI-Powered Summary

Using the AI API to summarize content from the clipboard.

```tsx
import { AI, environment, Clipboard, showToast, Toast, Detail } from "@raycast/api";
import { useState, useEffect } from "react";

export default function Command() {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function summarize() {
      if (!environment.canAccess(AI)) {
        showToast({ style: Toast.Style.Failure, title: "AI access required" });
        return;
      }

      const text = await Clipboard.readText();
      if (!text) {
        showToast({ style: Toast.Style.Failure, title: "No text in clipboard" });
        return;
      }

      try {
        const result = await AI.ask(`Summarize this: ${text}`);
        setSummary(result);
      } catch (e) {
        showToast({ style: Toast.Style.Failure, title: "AI request failed" });
      } finally {
        setLoading(false);
      }
    }
    summarize();
  }, []);

  return <Detail isLoading={loading} markdown={summary} />;
}
```
