import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

type DialogDescriptionProps = Omit<
  DialogPrimitive.Description.Props,
  "className"
>;

export function DialogDescription(props: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className="text-pretty font-medium text-muted-foreground"
      {...props}
    />
  );
}
