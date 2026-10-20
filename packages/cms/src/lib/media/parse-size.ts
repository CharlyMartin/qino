const SIZE_PATTERN = /^([1-9]\d{0,2})(KB|MB)$/;
const KB = 1024;
const MB = 1024 * KB;

/**
 * Converts a `MediaSize` such as `"5MB"` to bytes (1KB = 1024 bytes).
 * Returns `undefined` when it isn't 50–950KB in steps of 50, or 1–100MB.
 */
export function parseSize(size: string) {
  const match = SIZE_PATTERN.exec(size);
  if (!match) return undefined;

  const value = Number(match[1]);

  if (match[2] == "KB") {
    return value % 50 == 0 && value <= 950 ? value * KB : undefined;
  }

  return value <= 100 ? value * MB : undefined;
}
