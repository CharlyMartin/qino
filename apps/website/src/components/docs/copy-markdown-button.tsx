import { CheckIcon, CopyIcon } from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

const announcements = {
  idle: "",
  copied: "Markdown copied",
  error: "Could not copy the Markdown.",
};

export function CopyMarkdownButton({ markdown }: { markdown: string }) {
  const { status, copy } = useCopyToClipboard(markdown);

  return (
    <>
      <Button variant="outline" size="sm" onClick={copy}>
        {status == "copied" ? (
          <CheckIcon className="size-4" aria-hidden="true" />
        ) : (
          <CopyIcon className="size-4" aria-hidden="true" />
        )}
        {status == "copied" ? "Copied" : "Copy Markdown"}
      </Button>
      <span className="sr-only" role="status">
        {announcements[status]}
      </span>
    </>
  );
}
