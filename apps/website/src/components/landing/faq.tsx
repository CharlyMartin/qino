import type { ReactNode } from "react";

import { Accordion } from "@/components/ui/accordion";
import { AccordionContent } from "@/components/ui/accordion-content";
import { AccordionItem } from "@/components/ui/accordion-item";
import { AccordionTrigger } from "@/components/ui/accordion-trigger";

export type FaqItem = {
  question: string;
  answer: ReactNode;
};

type FaqProps = {
  items: Array<FaqItem>;
};

export function Faq({ items }: FaqProps) {
  return (
    <Accordion>
      {items.map(({ question, answer }) => (
        <AccordionItem key={question}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionContent>{answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
