import { Link } from "@tanstack/react-router";

export function PageNotFound() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        This page does not exist.
      </p>
      <nav aria-label="Page recovery" className="mt-6 flex gap-6">
        <Link to="/" className="underline underline-offset-4">
          Home
        </Link>
        <Link to="/docs" className="underline underline-offset-4">
          Documentation
        </Link>
      </nav>
    </main>
  );
}
