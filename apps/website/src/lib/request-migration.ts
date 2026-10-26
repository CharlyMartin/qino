import { getFormcarryErrorText } from "./get-formcarry-error-text";

const FORM_URL = "https://formcarry.com/s/GpSopgXeih4";

export type MigrationRequestState = {
  done: boolean;
  /** The sender's address, once done. */
  email?: string;
  errorText?: string;
};

/** The Contentlayer migration form's `useActionState` action. Posts from the browser, as formcarry expects. */
export async function requestMigration(
  _state: MigrationRequestState,
  fd: FormData,
) {
  try {
    // `Content-Type` is left to the browser, so it sets the multipart boundary.
    const response = await fetch(FORM_URL, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: fd,
    });
    const body = await response.json();
    if (body.code != 200) {
      console.error("Formcarry:", body);
      return { done: false, errorText: getFormcarryErrorText(body) };
    }
    const email = fd.get("email");
    return { done: true, email: typeof email == "string" ? email : undefined };
  } catch (error) {
    console.error("Formcarry:", error);
    return { done: false, errorText: getFormcarryErrorText() };
  }
}
