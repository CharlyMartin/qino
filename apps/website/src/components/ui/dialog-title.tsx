import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

type DialogTitleProps = Omit<DialogPrimitive.Title.Props, "className">;

export function DialogTitle(props: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      // Right padding keeps a long title clear of the close button.
      className="pr-10 text-2xl font-extrabold leading-tight tracking-tighter text-balance text-foreground"
      {...props}
    />
  );
}
