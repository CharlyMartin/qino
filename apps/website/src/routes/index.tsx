import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link to="/docs" className="text-sm underline underline-offset-4">
        Documentation
      </Link>
    </main>
  );
}
