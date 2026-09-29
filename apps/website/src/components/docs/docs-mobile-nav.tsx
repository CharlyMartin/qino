import { Dialog } from "@base-ui/react/dialog";
import { ListIcon, XIcon } from "@phosphor-icons/react/ssr";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { DocsNode } from "../../types/docs-node";
import { DocsSidebar } from "./docs-sidebar";

export function DocsMobileNav({
  nodes,
  activeSlug,
}: {
  nodes: Array<DocsNode>;
  activeSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const [lastSlug, setLastSlug] = useState(activeSlug);

  // Close the drawer once a link navigates to another page.
  if (activeSlug != lastSlug) {
    setLastSlug(activeSlug);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button variant="outline" size="sm" />}>
        <ListIcon className="size-4" aria-hidden="true" />
        Menu
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto overscroll-contain border-r bg-background p-4 transition-transform data-ending-style:-translate-x-full data-starting-style:-translate-x-full motion-reduce:transition-none">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-mono text-label uppercase text-muted-foreground">
              Documentation
            </Dialog.Title>
            <Dialog.Close render={<Button variant="ghost" size="inline" />}>
              <XIcon className="size-5" aria-hidden="true" />
              <span className="sr-only">Close menu</span>
            </Dialog.Close>
          </div>
          <DocsSidebar nodes={nodes} activeSlug={activeSlug} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
