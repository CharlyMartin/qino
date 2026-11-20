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
};

export type BuildConfig = {
  /**
   * Makes `qino build` write `qino/_generated/types.d.ts`. Defaults to `true`;
   * `false` skips it.
   */
  readonly types?: boolean;
  /**
   * Makes `qino build` write `llms.txt` and `index.md` at the root of
   * `mediaFolder`: the `llms.txt` template, with a link section for each
   * primitive that declares pages. Needs `siteUrl`.
   */
  readonly llmsTxt?: boolean | LlmsTxtConfig;
};

export type CliConfig = {
  /** Options for `qino check`. */
  readonly check?: CheckConfig;
  /** Options for `qino build`. */
  readonly build?: BuildConfig;
};
