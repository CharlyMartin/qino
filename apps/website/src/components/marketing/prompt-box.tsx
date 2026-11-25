import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { CopyButton } from "./copy-button";
import { Text } from "./text";

type PromptBoxProps = {
  prompt: string;
  copyLabel: string;
};

export function PromptBox({ prompt, copyLabel }: PromptBoxProps) {
  const { status, copy } = useCopyToClipboard(prompt);
  return (
    <div className="rounded-sm border">
      {/* The copy button sits in this strip: as a full-height square beside the prompt, it would grow with the text. */}
      <div className="flex h-10 items-center justify-between border-b pl-3">
        <Text size="small">
          {status == "copied" ? "Prompt copied!" : "Prompt for your agent"}
        </Text>
        <CopyButton status={status} onCopy={copy} label={copyLabel} size="sm" />
      </div>
      <p className="whitespace-pre-wrap wrap-anywhere px-3 py-4 font-mono text-sm text-foreground-2">
        {prompt}
      </p>
    </div>
  );
}
