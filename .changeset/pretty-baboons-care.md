---
"@qino/cms": minor
"@qino/tooling": minor
---

Adds `"parse": true` to relations and media rules in `config.json` when they have a `parse` callback, which can't be written to JSON. The cloud UI shows those fields read-only, since it can't tell which values the callback reads. `configFileSchema` and `ConfigFile` accept the new field.

Projects with a `parse` callback get a new `config.json`: run `qino build` after upgrading, or `qino check` reports it out of date.
