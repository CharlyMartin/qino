import type { SupportedFileExtension } from "../../types/utils";

/**
 * Describes an entry's body in `config.json`, so the UI doesn't map
 * extensions itself: Markdown or MDX after the frontmatter, `null` for JSON.
 * An object to leave room for body-only settings, like MDX components.
 */
export function serializeBody(extension: SupportedFileExtension) {
  switch (extension) {
    case ".json":
      return null;
    case ".mdx":
      return { format: "mdx" } as const;
    default:
      return { format: "markdown" } as const;
  }
}
