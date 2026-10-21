/** Jumps keyboard users past the header; pair it with `<main id="main-content">`. */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4"
    >
      Skip to content
    </a>
  );
}
