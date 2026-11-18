/** Whether `href` is a well-formed http or https URL. */
export function isWebUrl(href: string) {
  try {
    return ["http:", "https:"].includes(new URL(href).protocol);
  } catch {
    return false;
  }
}
