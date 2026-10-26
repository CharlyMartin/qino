import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";

type AccordionProps = Omit<AccordionPrimitive.Root.Props, "className">;

export function Accordion(props: AccordionProps) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className="flex w-full flex-col divide-y border-y"
      {...props}
    />
  );
}
