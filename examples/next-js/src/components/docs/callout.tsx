import type { ReactNode } from "react";

type CalloutProps = {
  type?: "note" | "warn" | "tip";
  children: ReactNode;
};

const TYPE_STYLES = {
  note: "border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
  warn: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  tip: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
};

export function Callout({ type = "note", children }: CalloutProps) {
  return (
    <div
      className={`not-prose my-4 rounded-md border px-4 py-3 text-sm ${TYPE_STYLES[type]}`}
    >
      {children}
    </div>
  );
}
