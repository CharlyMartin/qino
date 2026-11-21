# qino

qino is a flat-file Markdown CMS. It reads a content folder and hands typed entries to a consumer website, which owns rendering and routing.

## Agent-ready content

**Entry page**:
The page of the consumer's website that displays one entry. qino doesn't render or route it.
_Avoid_: Entry URL, post page, route

**Index page**:
The page of the consumer's website that lists a collection's or a tree's entries. Items have none.
_Avoid_: Listing page, archive

**Agent Markdown**:
The standalone Markdown document served to agents in place of an entry page or an index page.
_Avoid_: LLM Markdown, Markdown view, raw, markdown (the entry's body field)

**Markdown URL**:
The URL of a page's agent Markdown: the page's URL, without a trailing `/`, with `.md` appended, or `/index.md` for the homepage.
_Avoid_: Twin, .md route, raw URL

**llms.txt template**:
The hand-written Markdown that `llms.txt` is built from. qino inserts its link sections into it.
_Avoid_: Preamble, header, intro

## Media

**Image manifest**:
The record `qino build` keeps of each image an image field references: its size, dimensions and blur placeholder. A deployed server reads it in place of image files it doesn't have.
_Avoid_: Lock file, image cache, image metadata
