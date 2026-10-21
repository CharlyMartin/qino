import type { Forminit } from "forminit";

type ForminitError = Awaited<ReturnType<Forminit["submit"]>>["error"];

const fieldMessages: Record<string, string> = {
  "fi-sender-email": "Please enter a valid email address.",
  "fi-sender-fullName":
    "Please use only letters, spaces, hyphens, apostrophes and periods.",
};

/** Maps a Forminit error to visitor-facing text; `error.message` is developer text. */
export function getForminitErrorText(error?: ForminitError) {
  if (error?.error == "TOO_MANY_REQUESTS") {
    return "Please wait a few seconds and try again.";
  }
  // Forminit names the field in `fieldName`, or as the first quoted word of `message`.
  const fieldName = error?.fieldName ?? error?.message.match(/"([^"]+)"/)?.[1];
  return (
    (fieldName && fieldMessages[fieldName]) ??
    "Something went wrong. Please try again."
  );
}
