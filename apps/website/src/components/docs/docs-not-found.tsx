import { Link } from "@tanstack/react-router";

export function DocsNotFound() {
  return (
    <section>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        This documentation page does not exist.
      </p>
      <Link
        to="/docs"
        className="mt-6 inline-block underline underline-offset-4"
      >
        Back to documentation
      </Link>
    </section>
  );
}
