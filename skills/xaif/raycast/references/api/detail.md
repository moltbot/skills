# Detail



## API Reference

### Detail

Renders a markdown ([CommonMark](https://commonmark.org)) string with an optional metadata panel.

Typically used as a standalone view or when navigating from a List.

#### Example

{% tabs %}
{% tab title="Render a markdown string" %}

```typescript
import { Detail } from "@raycast/api";

export default function Command() {
  return <Detail markdown="**Hello** _World_!" />;
}
```

{% endtab %}

{% tab title="Render an image from the assets directory" %}

```typescript
import { Detail } from "@raycast/api";

export default function Command() {
  return <Detail markdown={`!Image Title`} />;
}
```

{% endtab %}
{% endtabs %}

#### Props

| Prop | Description | Type | Default |
| :--- | :--- | :--- | :--- |
| actions | A reference to an ActionPanel. | <code>React.ReactNode</code> | - |
| isLoading | Indicates whether a loading bar should be shown or hidden below the search bar | <code>boolean</code> | - |
| markdown | The CommonMark string to be rendered. | <code>string</code> | - |
| metadata | The `Detail.Metadata` to be rendered in the right side area | <code>React.ReactNode</code> | - |
| navigationTitle | The main title for that view displayed in Raycast | <code>string</code> | - |

{% hint style="info" %}
You can specify custom image dimensions by adding a `raycast-width` and `raycast-height` query string to the markdown image. For example: `!Image Title`

You can also specify a tint color to apply to an markdown image by adding a `raycast-tint-color` query string. For example: `!Image Title`
{% endhint %}

{% hint style="info" %}
You can now render [LaTeX](https://www.latex-project.org) in the markdown. We support the following delimiters:

- Inline math: `\(...\)` and `\begin{math}...\end{math}`
- Display math: `\[...\]`, `$$...$$` and `\begin{equation}...\end{equation}`

{% endhint %}

### Detail.Metadata

A Metadata view that will be shown in the right-hand-side of the `Detail`.

Use it to display additional structured data about the main content shown in the `Detail` view.



#### Example

```typescript
import { Detail } from "@raycast/api";

// Define markdown here to prevent unwanted indentation.
const markdown = `
