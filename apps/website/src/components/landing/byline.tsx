import type { ReactNode } from "react";

import { ExternalLink } from "./external-link";
import { Text } from "./text";

type BylineProps = {
  name: string;
  image: string;
  url: string;
  children: ReactNode;
};

export function Byline({ name, image, url, children }: BylineProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={image}
        alt={name}
        width={40}
        height={40}
        loading="lazy"
        className="size-10 shrink-0 rounded-full border border-primary p-0.5"
      />
      <div>
        <p className="text-sm font-medium">
          <ExternalLink href={url}>{name}</ExternalLink>
        </p>
        <Text size="small">{children}</Text>
      </div>
    </div>
  );
}
