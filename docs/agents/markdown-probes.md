# Markdown probes

Edge cases for any change that reads or rewrites a Markdown or MDX body, such as agent Markdown, the table of contents or stats. Each one broke something in an earlier change. Run each case that applies through the public API, and name the result.

- **CRLF line endings:** output and anything passed to a callback should be LF only.
- **Leading blank lines and frontmatter:** neither should reach the output.
- **`{#id}` headings:** qino's heading ids. Parse with `headingIds: true` (micromark: `micromarkHeadingId()` after `mdxjs()`), or MDX reads `{#id}` as an expression.
- **Body that isn't valid MDX,** such as one with an HTML comment (`<!-- -->`) or `a { b`: the parser falls back to plain Markdown. In that mode `<Tag>` lines become HTML blocks, so links inside them aren't tokenized.
- **MDX `import` and `export` lines** before the first heading or component.
- **Code fences and inline code:** links and components inside them stay untouched.
- **Link forms:** `/x` and `//x`, `https://x`, `<dest>`, titles, images, reference definitions, and links set by JSX attributes.
- **Containers:** list items, blockquotes (`> `), nested ones, and tables. Spliced multi-line text keeps their markers and indentation.
- **Inline and block components,** mid-sentence and on their own line, nested inside each other, fragments (`<>`), and member names (`Foo.Bar`).
- **Frontmatter values:** a title that is blank, multi-line or not a string, and YAML block-scalar descriptions (`|`, `>`), which end with a newline.
- **JSON entries,** which have no body even when they have a `markdown` field.
- **Names that are `Object.prototype` keys,** such as `constructor` and `__proto__`, used as a lookup key or a prop.
