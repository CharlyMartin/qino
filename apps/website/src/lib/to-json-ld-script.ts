export type JsonLd = Record<string, unknown>;

// `<` is escaped so content can't close the script tag early.
export function toJsonLdScript(data: JsonLd) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      ...data,
    }).replace(/</g, "\\u003c"),
  };
}
