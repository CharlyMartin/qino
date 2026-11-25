import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

type DialogProps = DialogPrimitive.Root.Props;

export function Dialog(props: DialogProps) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}
