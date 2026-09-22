export function PageError() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Unable to load this page</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Please reload the page to try again.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 underline underline-offset-4"
      >
        Reload page
      </button>
    </main>
  );
}
