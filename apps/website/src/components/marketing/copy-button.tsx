import { CheckIcon, CopyIcon } from "@phosphor-icons/react/ssr";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "@/components/ui/button";
import type { CopyStatus } from "@/hooks/use-copy-to-clipboard";

const copyIconVariants = cva("", {
  variants: {
    size: {
      default: "size-5",
      sm: "size-4",
    },
  },
  defaultVariants: { size: "default" },
});

type CopyButtonProps = VariantProps<typeof copyIconVariants> & {
  status: CopyStatus;
  onCopy: () => void;
  label: string;
};

const announcements = {
  idle: "",
  copied: "Copied",
  error: "Could not copy. Select the command and copy it manually.",
};

export function CopyButton({ status, onCopy, label, size }: CopyButtonProps) {
  return (
    <>
      <Button variant="divided" size="block" onClick={onCopy}>
        {status == "copied" ? (
          <CheckIcon
            className={copyIconVariants({ size })}
            aria-hidden="true"
          />
        ) : (
          <CopyIcon className={copyIconVariants({ size })} aria-hidden="true" />
        )}
        <span className="sr-only">{label}</span>
      </Button>
      <span className="sr-only" role="status">
        {announcements[status]}
      </span>
    </>
  );
}
