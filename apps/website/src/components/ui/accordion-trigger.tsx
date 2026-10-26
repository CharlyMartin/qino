import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { PlusIcon } from "@phosphor-icons/react/ssr";

type AccordionTriggerProps = Omit<
  AccordionPrimitive.Trigger.Props,
  "className"
>;

export function AccordionTrigger({
  children,
  ...props
}: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className="group flex flex-1 items-center justify-between gap-6 rounded-sm py-6 text-left text-row text-foreground-2 outline-none transition-colors hover:text-foreground aria-expanded:text-foreground motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-disabled:pointer-events-none aria-disabled:opacity-50"
        {...props}
      >
        {children}
        <PlusIcon
          weight="bold"
          className="size-4 shrink-0 text-primary transition-transform duration-200 group-aria-expanded:rotate-45 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}
