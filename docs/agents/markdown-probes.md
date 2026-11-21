# Markdown probes

Each of these edge cases broke something in an earlier change. Probe each one that applies through the public API. Each line gives the input, then what should come out.

- **CRLF and lone CR line endings:** qino's output, `children` and props are LF only. `entry` is passed as read, so its `markdown` and `description` keep CRLF.
- **Leading blank lines and frontmatter:** neither appears in the output.
- **`{#id}` headings:** they keep their ids, and the rest of the body still parses as MDX. A parser needs `headingIds: true`, or `micromarkHeadingId()` after `mdxjs()`. Otherwise MDX fails on `{#id}` and the whole body falls back to plain Markdown.
- **A body that isn't valid MDX,** such as one with `<!-- comment -->` or `a { b`: it falls back to plain Markdown, and its components stay as written. Links still become absolute, except inside an HTML block. A line that opens with a tag such as `<Tabs>` starts one, which runs to the next blank line.
- **Output from a component function that isn't valid MDX:** it affects only its own replacement, and links elsewhere still become absolute.
- **A body that opens with its own H1:** this includes after `import` or `export` lines, as a setext heading (`Title` over `===`), or from a component's output. qino adds no `# title` or description.
- **Code fences and inline code:** links and components inside them stay as written.
- **Link forms:**
  - `/x` destinations become absolute, in links, images and reference definitions.
  - `//x`, `https://x`, `#x` and JSX attribute values stay as written.
  - `<dest>` and link titles keep their syntax.
- **Containers:** a component on its own line in a list item or blockquote has every line of its replacement kept inside it. Blockquote markers stay, and list markers become spaces. A component after text on its line is spliced in with no prefix.
- **Components:**
  - Inline, block and nested components are replaced from the inside out.
  - Fragments (`<>`) stay as written, with their insides replaced.
  - Member names such as `Foo.Bar` match by their full name.
- **Frontmatter values:**
  - A multi-line title is collapsed onto one line.
  - A blank or non-string title falls back to the slug.
  - A YAML block-scalar description (`|`, `>`) ends in a newline, which qino trims.
- **Text qino writes into Markdown,** such as a listing link: `[`, `]` and `\` in a title are escaped, and `(` and `)` in a URL are percent-encoded, so the link stays whole.
- **JSON entries:** only the heading and description come out, even when the entry has a `markdown` field.
- **Names that are `Object.prototype` keys,** such as `constructor` and `__proto__`: a component with that name stays as written unless the map gives it a function, and a prop with that name is an own property.
