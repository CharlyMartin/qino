export type LocalAssetReferencesConfig = {
  /** URL globs served by routes instead of `mediaFolder`, e.g. `"/og/**"`. */
  readonly exclude?: ReadonlyArray<string>;
};

export type CheckConfig = {
  /**
   * Makes `qino check` verify that every local file referenced in content
   * exists in `mediaFolder`. Defaults to `true`; `false` skips the check.
   */
  readonly localAssetReferences?: boolean | LocalAssetReferencesConfig;
};

export type LlmsTxtConfig = {
  /**
   * The `llms.txt` template, relative to `contentFolder`. Defaults to
   * `"llms.md"`.
   */
  readonly template?: string;
  /**
   * Makes `qino build` also write a section llms.txt for each collection and
   * tree that declares pages, at its index page's path, such as
   * `/docs/llms.txt`, and makes `llms.txt` link to them under `## Sections`
   * in place of their link sections. Defaults to `false`.
   */
  readonly sections?: boolean;
};

export type BuildConfig = {
  /**
   * Makes `qino build` write `qino/_generated/types.d.ts`. Defaults to `true`;
   * `false` skips it.
   */
  readonly types?: boolean;
  /**
   * Makes `qino build` write three files at the root of `mediaFolder`:
   * `llms.txt`, the `llms.txt` template with a link section for each
   * primitive that declares pages; `llms-full.txt`, every entry page's
   * Markdown without its frontmatter block; and `index.md`, `llms.txt` after
   * a frontmatter block. Needs `siteUrl`.
   */
  readonly llmsTxt?: boolean | LlmsTxtConfig;
};

export type CliConfig = {
  /** Options for `qino check`. */
  readonly check?: CheckConfig;
  /** Options for `qino build`. */
  readonly build?: BuildConfig;
};
