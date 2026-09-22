import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

export function MdxLink({ href, download, ...props }: ComponentProps<"a">) {
  if (
    !href ||
    !/^\/docs(?:\/|\?|#|$)/.test(href) ||
    (download != null && download !== false)
  ) {
    return <a {...props} href={href} download={download} />;
  }

  // ponytail: let the router parse the authored URL, including search and hash.
  return <Link {...props} to={href} href={href} />;
}
