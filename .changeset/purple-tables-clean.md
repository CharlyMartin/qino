---
"@qino/cms": patch
---

Fixes `qino build` rejecting `sortableBy`, `media.fields`, and `saveAs` fields narrowed by an intersection, such as `z.unknown().and(z.string())`: intersections now narrow a field's types instead of adding them up.
