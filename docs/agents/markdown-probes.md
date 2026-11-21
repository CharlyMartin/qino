# Markdown probes

Each of these edge cases broke something in an earlier change. Probe each one that applies through the public API. Each line gives the input, then what should come out.

- **CRLF and lone CR line endings:** qino's output, `children` and props are LF only. `entry` is passed as read, so its `markdown` and `description` keep CRLF.
- **Leading blank lines and frontmatter,** in a body or in the `llms.txt` template: neither appears in the output.
- **`{#id}` headings:** they keep their ids, and the rest of the body still parses as MDX: it neither falls back to plain Markdown nor, when scanned for media, throws.
- **A body that isn't valid MDX,** such as one with `<!-- comment -->` or `a { b`: it falls back to plain Markdown, and its components stay as written. Links still become absolute, except inside an HTML block. A line that opens with a tag such as `<Tabs>` starts one, which runs to the next blank line.
- **Output from a component function that isn't valid MDX:** it affects only its own replacement, and links elsewhere still become absolute.
- **A body that opens with its own H1:** this includes after `import` or `export` lines, as a setext heading (`Title` over `===`), or from a component's output, or after HTML or MDX comments, indented or several on a line, or after a link definition such as `[guide]: /guide`. In the `llms.txt` template, a definition between the H1 and the summary keeps the summary in `llms-full.txt`. qino adds no `# title` or description. Text between two comments still renders, so qino adds the heading.
- **Code fences and inline code:** links and components inside them stay as written.
- **Link forms:**
  - `/x` destinations become absolute, in links, images and reference definitions, and in the `description` too: in its blockquote and in index listings.
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

## `Accept` headers

These apply to `negotiateMarkdown`. The host rewrites' regex reads only the first range, so on a header whose only Markdown range comes first, it should answer the same for quoted values, `q=0` and malformed q-values.

- **Quoted parameter values:** `text/markdown;note="a,b";q=0` and `text/markdown;note="x;q=1";q=0` keep their `q=0`, and so does a value with an escaped quote, `note="say \"hi\""`. An unclosed quote runs to the end of the header, so `text/markdown;note="x` gets Markdown from `negotiateMarkdown` and HTML from the regex.
- **`q=0` after another parameter,** as in `text/markdown;charset=utf-8;q=0`, and `q=0.`, which RFC 9110 allows: Markdown isn't acceptable.
- **Malformed q-values,** such as `q=1.5`, `q=oops` or `q=0.0001`: the range is ignored.
- **Case:** both read `Q=` as `q=`. `TEXT/MARKDOWN` counts for `negotiateMarkdown`, while the regex matches lowercase types only.
- **Ties:** `text/markdown, text/html` gets Markdown and `text/html, text/markdown` gets HTML, while `*/*, text/markdown` gets Markdown, since a named type beats a wildcard.
