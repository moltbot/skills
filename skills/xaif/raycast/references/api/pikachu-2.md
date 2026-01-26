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
          <Detail.Metadata.Link title="Evolution" target="https://www.pokemon.com/us/pokedex/pikachu" text="Raichu" />
        </Detail.Metadata>
      }
    />
  );
}
```

#### Props

| Prop | Description | Type | Default |
| :--- | :--- | :--- | :--- |
| target<mark style="color:red;">*</mark> | The target of the link. | <code>string</code> | - |
| text<mark style="color:red;">*</mark> | The text value of the item. | <code>string</code> | - |
| title<mark style="color:red;">*</mark> | The title shown above the item. | <code>string</code> | - |

### Detail.Metadata.TagList

A list of `Tags` displayed in a row.



#### Example

```typescript
import { Detail } from "@raycast/api";

// Define markdown here to prevent unwanted indentation.
const markdown = `
