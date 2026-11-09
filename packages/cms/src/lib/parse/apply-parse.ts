type Parse<Context> = (value: string, ctx: Context) => string | undefined;

type ApplyParseParams<Context> = {
  value: string;
  parse: Parse<Context> | undefined;
  ctx: Context;
  /** Names the field in errors, e.g. `Relation "author" in posts/a.md`. */
  owner: string;
};

/**
 * Runs a `parse` callback on a raw value. A string replaces the value;
 * `undefined` (or `null`) keeps it, so qino's own format still applies.
 */
export function applyParse<Context>({
  value,
  parse,
  ctx,
  owner,
}: ApplyParseParams<Context>) {
  if (!parse) return value;

  let parsed: unknown;
  try {
    parsed = parse(value, ctx);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(
      `${owner}: parse failed for ${JSON.stringify(value)}: ${message}`,
      { cause },
    );
  }

  if (parsed == undefined) return value;

  if (typeof parsed != "string") {
    throw new Error(
      `${owner}: parse must return a string or undefined, got ${typeof parsed} for ${JSON.stringify(value)}.`,
    );
  }

  return parsed;
}
