import type { ReactNode } from "react";

import { Text } from "./text";
import { Title } from "./title";

type SectionHeadingProps = {
  id: string;
  title: ReactNode;
  children: ReactNode;
};

export function SectionHeading({ id, title, children }: SectionHeadingProps) {
  return (
    <>
      <div className="max-w-2xl">
        <Title id={id}>{title}</Title>
      </div>
      <div className="mt-4 max-w-xl">
        <Text>{children}</Text>
      </div>
    </>
  );
}
