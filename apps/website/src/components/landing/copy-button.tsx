import { CheckIcon, CopyIcon } from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import type { CopyStatus } from "@/hooks/use-copy-to-clipboard";

type CopyButtonProps = {
  status: CopyStatus;
  onCopy: () => void;
  label: string;
};

const announcements = {
  idle: "",
  copied: "Copied",
  error: "Could not copy. Select the command and copy it manually.",
};

export function CopyButton({ status, onCopy, label }: CopyButtonProps) {
  return (
    <>
      <Button variant="divided" size="block" onClick={onCopy}>
        {status == "copied" ? (
          <CheckIcon className="size-5" aria-hidden="true" />
        ) : (
          <CopyIcon className="size-5" aria-hidden="true" />
        )}
        <span className="sr-only">{label}</span>
      </Button>
      <span className="sr-only" role="status">
        {announcements[status]}
      </span>
    </>
  );
}
