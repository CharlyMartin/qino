import type { Icon } from "@phosphor-icons/react";
import type { ComponentProps, ReactNode } from "react";

type CalloutProps = Omit<ComponentProps<"div">, "className" | "title"> & {
  icon: Icon;
  title: ReactNode;
};

export function Callout({
  icon: IconComponent,
  title,
  children,
  ...props
}: CalloutProps) {
  return (
    <div
      className="flex gap-3 rounded-sm border border-l-2 border-border-strong border-l-primary bg-surface p-4 text-left motion-safe:animate-rise-in"
      {...props}
    >
      <IconComponent
        weight="fill"
        className="mt-0.5 size-5 shrink-0 text-primary"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="font-bold text-foreground">{title}</p>
        <div className="text-sm font-medium text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
