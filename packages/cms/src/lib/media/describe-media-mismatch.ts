const KB = 1024;
const MB = 1024 * KB;

type MediaRule = { accepted: string; maxSize: number };
type DescribeMediaMismatchParams = {
  type: string | undefined;
  size: number;
  rules: ReadonlyArray<MediaRule>;
};

/**
 * Explains why a file of `type` and `size` (in bytes) matches none of
 * `rules`, `maxSize` in bytes. Returns `undefined` when one rule matches.
 */
export function describeMediaMismatch({
  type,
  size,
  rules,
}: DescribeMediaMismatchParams) {
  const matching = rules.filter(({ accepted }) => accepted == type);

  if (matching.length == 0) {
    const accepted = [...new Set(rules.map((rule) => rule.accepted))];
    return `is ${type ?? "of an unknown type"}, but only ${accepted.join(", ")} ${accepted.length == 1 ? "is" : "are"} accepted.`;
  }

  if (matching.every(({ maxSize }) => size > maxSize)) {
    const maxSize = Math.max(...matching.map((rule) => rule.maxSize));
    return `is ${formatSize(size)}, over the ${formatSize(maxSize)} limit.`;
  }
}

function formatSize(bytes: number) {
  return bytes >= MB
    ? `${Number((bytes / MB).toFixed(1))}MB`
    : `${Math.ceil(bytes / KB)}KB`;
}
