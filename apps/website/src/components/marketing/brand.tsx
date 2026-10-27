import type { ReactNode } from "react";
import { siDecapcms, siTina } from "simple-icons";

import { SimpleIcon } from "./simple-icon";

const icons = {
  decap: siDecapcms,
  tina: siTina,
};

type BrandProps = {
  icon: keyof typeof icons;
  children: ReactNode;
};

export function Brand({ icon, children }: BrandProps) {
  return (
    // Plain inline box, like InlineCode, so it keeps the text baseline and line height.
    <span className="rounded-xs bg-surface px-1 py-0.5 whitespace-nowrap text-foreground-2">
      <SimpleIcon icon={icons[icon]} size="inline" /> {children}
    </span>
  );
}
