import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "@phosphor-icons/react/ssr";

import { Button } from "./button";

type DialogContentProps = Omit<DialogPrimitive.Popup.Props, "className">;

export function DialogContent({ children, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal data-slot="dialog-portal">
      <DialogPrimitive.Backdrop
        data-slot="dialog-overlay"
        className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none supports-backdrop-filter:backdrop-blur-xs"
      />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className="fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 overflow-y-auto overscroll-contain rounded-sm border border-border-strong bg-background p-5 text-left outline-none transition-[opacity,scale] duration-150 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none sm:max-w-lg md:p-7"
        {...props}
      >
        {children}
        <div className="absolute top-3 right-3">
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={<Button variant="ghost" size="sm" />}
          >
            <XIcon className="size-5" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}
