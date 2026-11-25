import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

type DialogTriggerProps = Omit<DialogPrimitive.Trigger.Props, "className">;

export function DialogTrigger(props: DialogTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}
