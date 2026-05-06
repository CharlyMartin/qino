import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Blog
      </h1>
      <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        A flat-file Markdown blog powered by Qino.
      </p>
      <Link
        href="/posts"
        className="text-base font-medium text-zinc-950 underline underline-offset-4 hover:no-underline dark:text-zinc-50"
      >
        {"Read the posts >"}
      </Link>
    </main>
  );
}
