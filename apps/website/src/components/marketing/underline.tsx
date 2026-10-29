import type { ReactNode } from "react";

type UnderlineProps = {
  children: ReactNode;
};

export function Underline({ children }: UnderlineProps) {
  return (
    <span className="underline decoration-primary/50 decoration-2 underline-offset-[0.12em]">
      {children}
    </span>
  );
}
