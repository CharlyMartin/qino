import { ScrollArea } from "@base-ui/react/scroll-area";
import { cva, type VariantProps } from "class-variance-authority";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { CopyButton } from "./copy-button";

const commandVariants = cva("px-3 py-4 font-mono text-sm", {
  variants: {
    tone: {
      install: "text-foreground-2",
      build: "text-foreground-3",
    },
  },
  defaultVariants: { tone: "install" },
});

type CommandLineProps = VariantProps<typeof commandVariants> & {
  command: string;
  copyLabel: string;
};

export function CommandLine({ command, copyLabel, tone }: CommandLineProps) {
  const { status, copy } = useCopyToClipboard(command);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto]">
      <ScrollArea.Root className="min-w-0">
        <ScrollArea.Viewport className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50">
          <ScrollArea.Content>
            <pre className={commandVariants({ tone })}>
              <code>
                <span className="text-primary" aria-hidden="true">
                  ${" "}
                </span>
                {status == "copied" ? "command copied!" : command}
              </code>
            </pre>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="horizontal"
          className="m-0.5 flex h-2.5 touch-none select-none rounded-full p-0.5"
        >
          <ScrollArea.Thumb className="rounded-full bg-border-strong hover:bg-muted-foreground" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
      <CopyButton status={status} onCopy={copy} label={copyLabel} />
    </div>
  );
}
