import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";

const codeBlockVariants = cva(
  "min-w-0 overflow-x-auto font-mono text-code text-foreground-2",
  {
    variants: {
      framed: {
        true: "p-4 md:p-5",
        false: "",
      },
    },
    defaultVariants: { framed: false },
  },
);

export type Snippet = { label: string; html: string };

type CodeBlockProps = Omit<ComponentProps<"pre">, "className" | "children"> & {
  // From `getSnippets`: code highlighted with the docs' highlight.js theme.
  snippet: Snippet;
  filename?: string;
};

export function CodeBlock({ snippet, filename, ...props }: CodeBlockProps) {
  const code = (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: Names the focusable scroll area for screen readers.
    <pre
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Horizontally scrolling code must be reachable with a keyboard.
      tabIndex={0}
      className={codeBlockVariants({ framed: Boolean(filename) })}
      aria-label={snippet.label}
      {...props}
    >
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Escaped by highlight.js from our own content files. */}
      <code dangerouslySetInnerHTML={{ __html: snippet.html }} />
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
