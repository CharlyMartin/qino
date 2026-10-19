const formatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCount(count: number) {
  return formatter.format(count).toLowerCase();
}
