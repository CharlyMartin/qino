export type FormcarryResponse = {
  code: number;
  message?: string;
  /** Present on 422, keyed by field name. */
  errors?: Record<string, unknown>;
};

const fieldMessages: Record<string, string> = {
  email: "Please enter a valid email address.",
};

/** Maps a formcarry error response to visitor-facing text; its `message` is developer text. */
export function getFormcarryErrorText(response?: FormcarryResponse) {
  if (response?.code == 429) {
    return "Please wait a few seconds and try again.";
  }
  const fieldName = Object.keys(response?.errors ?? {}).find(
    (name) => name in fieldMessages,
  );
  return (
    (fieldName && fieldMessages[fieldName]) ??
    "Something went wrong. Please try again."
  );
}
