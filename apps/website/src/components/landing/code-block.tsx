import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const codeBlockVariants = cva("min-w-0 overflow-x-auto font-mono text-code", {
  variants: {
    variant: {
      plain: "text-foreground-2",
      result: "text-foreground-3",
    },
    framed: {
      true: "p-4 md:p-5",
      false: "",
    },
  },
  defaultVariants: { variant: "plain", framed: false },
});

type CodeBlockProps = Omit<ComponentProps<"pre">, "className"> &
  Pick<VariantProps<typeof codeBlockVariants>, "variant"> & {
    filename?: string;
  };

export function CodeBlock({
  children,
  filename,
  variant,
  ...props
}: CodeBlockProps) {
  const code = (
    <pre
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Horizontally scrolling code must be reachable with a keyboard.
      tabIndex={0}
      className={codeBlockVariants({ variant, framed: Boolean(filename) })}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
  return filename ? (
    <div className="min-w-0 overflow-hidden rounded-sm border bg-surface/50">
      <div className="border-b px-4 py-2.5 font-mono text-xs text-muted-foreground">
        {filename}
      </div>
      {code}
    </div>
  ) : (
    code
  );
}
