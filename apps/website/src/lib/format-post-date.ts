const postDateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  // ISO dates parse as UTC midnight, so format in UTC to keep the same day.
  timeZone: "UTC",
});

export function formatPostDate(date: string) {
  return postDateFormat.format(new Date(date));
}
