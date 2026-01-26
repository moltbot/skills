# Pikachu

![](https://assets.pokemon.com/assets/cms2/img/pokedex/full/025.png)

Pikachu that can generate powerful electricity have cheek sacs that are extra soft and super stretchy.
`;

export default function Main() {
  return (
    <Detail
      markdown={markdown}
      navigationTitle="Pikachu"
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.TagList title="Type">
            <Detail.Metadata.TagList.Item text="Electric" color={"#eed535"} />
          </Detail.Metadata.TagList>
        </Detail.Metadata>
      }
    />
  );
}
```

#### Props

| Prop | Description | Type | Default |
| :--- | :--- | :--- | :--- |
| children<mark style="color:red;">*</mark> | The tags contained in the TagList. | <code>React.ReactNode</code> | - |
| title<mark style="color:red;">*</mark> | The title shown above the item. | <code>string</code> | - |

### Detail.Metadata.TagList.Item

A Tag in a `Detail.Metadata.TagList`.

#### Props

| Prop | Description | Type | Default |
| :--- | :--- | :--- | :--- |
| color | Changes the text color to the provided color and sets a transparent background with the same color. | <code>Color.ColorLike</code> | - |
| icon | The optional icon tag icon. Required if the tag has no text. | <code>Image.ImageLike</code> | - |
| onAction | Callback that is triggered when the item is clicked. | <code>() => void</code> | - |
| text | The optional tag text. Required if the tag has no icon. | <code>string</code> | - |

### Detail.Metadata.Separator

A metadata item that shows a separator line. Use it for grouping and visually separating metadata items.



```typescript
import { Detail } from "@raycast/api";

// Define markdown here to prevent unwanted indentation.
const markdown = `
