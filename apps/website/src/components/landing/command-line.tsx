import { cva, type VariantProps } from "class-variance-authority";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { CopyButton } from "./copy-button";

const commandVariants = cva(
  "min-w-0 overflow-x-auto px-3 py-4 font-mono text-sm",
  {
    variants: {
      tone: {
        install: "text-foreground-2",
        build: "text-foreground-3",
      },
    },
    defaultVariants: { tone: "install" },
  },
);

type CommandLineProps = VariantProps<typeof commandVariants> & {
  command: string;
  copyLabel: string;
};

export function CommandLine({ command, copyLabel, tone }: CommandLineProps) {
  const { status, copy } = useCopyToClipboard(command);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto]">
      <pre className={commandVariants({ tone })}>
        <code>
          <span className="text-primary" aria-hidden="true">
            ${" "}
          </span>
          {status == "copied" ? "command copied!" : command}
        </code>
      </pre>
      <CopyButton status={status} onCopy={copy} label={copyLabel} />
    </div>
  );
}
