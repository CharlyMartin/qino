import { Forminit } from "forminit";

import { getForminitErrorText } from "./get-forminit-error-text";

const FORM_ID = "juefzs1aj3x";

const forminit = new Forminit();

export type NewsletterState = {
  done: boolean;
  errorText?: string;
};

/** The newsletter form's `useActionState` action. */
export async function subscribeToNewsletter(
  _state: NewsletterState,
  fd: FormData,
) {
  // Forminit rejects curly apostrophes in sender names.
  const name = fd.get("fi-sender-fullName");
  if (typeof name == "string") {
    fd.set("fi-sender-fullName", name.replace(/[‘’]/g, "'"));
  }

  try {
    const { data, error } = await forminit.submit(FORM_ID, fd);
    if (error || typeof data?.hashId != "string") {
      console.error("Forminit:", error ?? data);
      return { done: false, errorText: getForminitErrorText(error) };
    }
    return { done: true };
  } catch (error) {
    console.error("Forminit:", error);
    return { done: false, errorText: getForminitErrorText() };
  }
}
