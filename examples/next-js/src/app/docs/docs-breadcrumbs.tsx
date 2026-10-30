import type { TreeNode } from "@qino/cms";
import Link from "next/link";

type DocsBreadcrumbsProps = {
  ancestors: Array<TreeNode>;
  title: string;
};

export function DocsBreadcrumbs({ ancestors, title }: DocsBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-8 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
    >
      <Link href="/docs" className="hover:underline">
        Docs
      </Link>
      {ancestors.map((node) => (
        <span key={node.slug} className="flex items-center gap-2">
          <span aria-hidden>/</span>
          <Link href={`/docs/${node.slug}`} className="hover:underline">
            {node.title}
          </Link>
        </span>
      ))}
      <span aria-hidden>/</span>
      <span aria-current="page" className="text-zinc-950 dark:text-zinc-50">
        {title}
      </span>
    </nav>
  );
}
