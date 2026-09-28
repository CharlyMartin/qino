import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Text } from "./text";
import { Title } from "./title";

type SpecRowProps = {
  label: string;
  title: string;
  children: ReactNode;
  notes: ReactNode;
  command?: boolean;
};

export function SpecRow({
  label,
  title,
  children,
  notes,
  command = false,
}: SpecRowProps) {
  return (
    <div className="grid gap-3 py-7 md:grid-cols-12 md:gap-x-7 lg:items-baseline">
      <dt
        className={cn(
          "font-mono text-xs font-medium text-primary md:col-span-3 lg:col-span-2",
          !command && "tracking-widest uppercase",
        )}
      >
        {label}
      </dt>
      <dd className="min-w-0 md:col-span-9 lg:col-span-7">
        <Title as="h3" size="row">
          {title}
        </Title>
        <div className="mt-2 max-w-lg">
          <Text>{children}</Text>
        </div>
      </dd>
      <dd className="min-w-0 font-mono text-xs leading-loose text-muted-foreground md:col-span-9 md:col-start-4 lg:col-span-3 lg:col-start-auto">
        {notes}
      </dd>
    </div>
  );
}
