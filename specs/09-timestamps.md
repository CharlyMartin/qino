# Timestamps

**Status:** v1-proposed (API not yet decided)
**Version:** v1 (target — slips to V2 if API doesn't land)

## Intent

It's common for entries to track `published-at` / `updated-at` (or `-on`) in frontmatter. Qino should manage these automatically when an entry is published or edited — most of the value comes from the cloud UI side, but the typing must work for hand-edited files too.

Convention from the brainstorm:

- `published-at` / `updated-at` → full ISO datetime.
- `published-on` / `updated-on` → ISO date, no time.

## API (sketch — not finalised)

```ts
import { defineCollection } from "qino";
import z from "zod";

const PostSchema = z.object({
  title: z.string(),
  "published-on": z.qino().publishedOn(),
  "updated-on": z.qino().updatedOn(),
});
```

Or as standalone helpers:

```ts
import { publishedOn, updatedOn } from "qino";

const PostSchema = z.object({
  title: z.string(),
  "published-on": publishedOn(),
  "updated-on": updatedOn(),
});
```

The marker tells:

- the cloud UI to set the field automatically on publish / edit.
- the schema validator to require the right datetime format.
- `qino build` to surface entries with missing values when they should have been set.

## Behaviour

- These markers do **not** rewrite files in V1. The CLI doesn't mutate content. The cloud UI is the writer.
- Hand-edited content can still set the field manually — it's just a typed `string` to Zod.
- The marker is recorded in the lock file so the cloud UI knows which fields to manage:

```json
"timestamps": {
  "published-on": "publishedOn",
  "updated-on":   "updatedOn"
}
```

## Open questions

- API form: `z.qino().publishedOn()` vs standalone `publishedOn()` vs Zod-style `z.qino.timestamp("publishedOn")`. Pick one.
- Field naming: enforce `-at` / `-on` convention, or let the developer name freely? Probably let them name freely.
- What does `qino build` do if a field is marked `publishedOn` but the file doesn't have it? Default to silent (cloud UI fills it on publish), with a `--strict` flag to fail.
- Slip-to-V2 trigger: if API isn't decided by the time relationships and sort land, defer.

## Acceptance criteria

Done when:

- A schema can mark a field as `publishedOn` / `updatedOn` and the lock file reflects it.
- Hand-edited entries with valid ISO strings pass validation.
- Hand-edited entries with invalid strings fail validation with a helpful error.
- The cloud UI (V2) can read the lock file and know which fields to set automatically.
