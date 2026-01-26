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
          <Detail.Metadata.Label title="Height" text={`1' 04"`} icon="weight.svg" />
        </Detail.Metadata>
      }
    />
  );
}
```

#### Props

| Prop | Description | Type | Default |
| :--- | :--- | :--- | :--- |
| title<mark style="color:red;">*</mark> | The title of the item. | <code>string</code> | - |
| icon | An icon to illustrate the value of the item. | <code>Image.ImageLike</code> | - |
| text | The text value of the item.  Specifying `color` will display the text in the provided color. Defaults to Color.PrimaryText. | <code>string</code> or <code>{ color?: Color; value: string }</code> | - |

### Detail.Metadata.Link

An item to display a link.



#### Example

```typescript
import { Detail } from "@raycast/api";

// Define markdown here to prevent unwanted indentation.
const markdown = `
