---
"@qino/cms": minor
---

Adds `parse` to relations and media fields, to read content that can't follow qino's path conventions, such as an Obsidian vault linking notes with `[[Jane Doe]]`. `parse` turns a raw value into a content path or a media URL, which qino then checks and reads as usual. Return `undefined` to read the value as is:

```ts
relations: {
  author: {
    target: authorCollection,
    parse: (value, { target }) => {
      const name = /^\[\[(.+)\]\]$/.exec(value)?.[1];
      if (!name || target.is == "item") return undefined;
      return `${target.directory}/${name}${target.extension}`;
    },
  },
},
media: {
  cover: {
    accepted: "image/png",
    maxSize: "5MB",
    parse: (value) => {
      const name = /^\[\[(.+)\]\]$/.exec(value)?.[1];
      return name ? `/${encodeURIComponent(name)}` : undefined;
    },
  },
},
```

A media field's parsed URL replaces its value, including `QinoImage.src`, and `qino check` checks it. The `RelationParse` and `MediaParse` types are exported for callbacks declared on their own.
