import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";

type AccordionItemProps = Omit<AccordionPrimitive.Item.Props, "className">;

export function AccordionItem(props: AccordionItemProps) {
  return <AccordionPrimitive.Item data-slot="accordion-item" {...props} />;
}
