import type { ReactNode } from "react";

type SpecTableProps = {
  children: ReactNode;
};

export function SpecTable({ children }: SpecTableProps) {
  return <dl className="mt-9 divide-y border-t">{children}</dl>;
}
