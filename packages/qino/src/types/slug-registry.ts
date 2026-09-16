import type { GenericPath, Slug } from "./utils";

/**
 * Maps a primitive's directory (e.g. `"/posts"`) to the union of its known
 * slugs. Empty by default; `qino build` augments it via the generated
 * `qino/_generated/types.d.ts`:
 *
 * ```ts
 * declare module "@qino/cms" {
 *   interface QinoSlugRegistry {
 *     "/posts": "a" | "b" | (string & {});
 *   }
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: augmented by the generated qino/_generated/types.d.ts
export interface QinoSlugRegistry {}

/**
 * Resolves the slug type for a primitive directory. Falls back to `Slug`
 * (`string`) when the registry has no entry for `Dir`, so getters accept any
 * string until `qino build` generates the augmentation.
 */
export type SlugFor<Dir extends GenericPath> =
  Dir extends keyof QinoSlugRegistry ? QinoSlugRegistry[Dir] : Slug;
