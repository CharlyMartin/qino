import type { ReactNode } from "react";

const tones = {
  kw: "text-muted-foreground",
  fn: "text-primary",
  string: "text-code-string",
  comment: "text-muted-foreground",
};

type CodeTokenProps = {
  kind: keyof typeof tones;
  children: ReactNode;
};

export function CodeToken({ kind, children }: CodeTokenProps) {
  return <span className={tones[kind]}>{children}</span>;
}
