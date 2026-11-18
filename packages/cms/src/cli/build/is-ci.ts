const OPT_OUT_VALUES = ["", "0", "false"];

/**
 * Whether the CLI runs in CI, read from the `CI` environment variable that CI
 * providers and hosts like GitHub Actions and Vercel set. `CI=false` opts out.
 */
export function isCi() {
  const { CI } = process.env;
  return CI != null && !OPT_OUT_VALUES.includes(CI.toLowerCase());
}
