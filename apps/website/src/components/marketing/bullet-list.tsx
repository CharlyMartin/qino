import type { ReactNode } from "react";

type BulletListProps = {
  items: Array<ReactNode>;
};

export function BulletList({ items }: BulletListProps) {
  return (
    <ul className="mt-6 max-w-xl list-disc space-y-2 pl-5 text-body font-medium text-pretty text-muted-foreground marker:text-primary">
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Static copy that never reorders.
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
