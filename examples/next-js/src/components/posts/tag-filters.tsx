import Link from "next/link";

type Tag = {
  slug: string;
  name: string;
};

type TagFiltersProps = {
  tags: Array<Tag>;
  activeTag?: string;
};

const baseClass = "rounded-full border px-3 py-1 text-sm transition-colors";
const activeClass =
  "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950";
const inactiveClass =
  "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700";

export function TagFilters({ tags, activeTag }: TagFiltersProps) {
  const items = [{ slug: undefined, name: "All" }, ...tags];

  return (
    <nav aria-label="Filter posts by tag">
      <ul className="flex flex-wrap gap-2">
        {items.map((tag) => {
          const isActive = tag.slug == activeTag;

          return (
            <li key={tag.slug ?? "all"}>
              <Link
                href={tag.slug ? `/posts/tags/${tag.slug}` : "/posts"}
                aria-current={isActive ? "page" : undefined}
                className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
              >
                {tag.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
