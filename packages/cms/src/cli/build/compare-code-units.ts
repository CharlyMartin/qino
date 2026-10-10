/**
 * Locale-independent string order, so generated files that get committed are
 * byte-identical on every machine (`localeCompare` follows the process locale).
 */
export function compareCodeUnits(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}
