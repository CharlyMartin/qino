import type { ComponentProps } from "react";

type ExternalLinkProps = Omit<ComponentProps<"a">, "className" | "href"> & {
  href: string;
};

export function ExternalLink({ href, ...props }: ExternalLinkProps) {
  const url = new URL(href);
  url.searchParams.set("utm_source", "qino");

  return (
    <a
      href={url.toString()}
      className="text-foreground-3 underline underline-offset-4 transition-colors hover:text-foreground"
      {...props}
    />
  );
}
