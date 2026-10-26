import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";

type AccordionContentProps = Omit<AccordionPrimitive.Panel.Props, "className">;

export function AccordionContent({
  children,
  ...props
}: AccordionContentProps) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-starting-style:h-0 data-ending-style:h-0 motion-reduce:transition-none"
      {...props}
    >
      <div className="max-w-2xl pb-6 pr-10 font-medium text-pretty text-muted-foreground">
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}
