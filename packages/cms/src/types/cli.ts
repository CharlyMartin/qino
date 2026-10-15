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

export type BuildConfig = {
  /**
   * Makes `qino build` write `qino/_generated/types.d.ts`. Defaults to `true`;
   * `false` skips it.
   */
  readonly types?: boolean;
};

export type CliConfig = {
  /** Options for `qino check`. */
  readonly check?: CheckConfig;
  /** Options for `qino build`. */
  readonly build?: BuildConfig;
};
