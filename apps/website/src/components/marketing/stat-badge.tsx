import type { SimpleIcon as Icon } from "simple-icons";

import { formatCount } from "@/lib/format-count";
import type { StatCount } from "@/types/project-stats";
import { SimpleIcon } from "./simple-icon";

type StatBadgeProps = {
  icon: Icon;
  href: string;
  /** Spoken instead of the count when the request fails. */
  name: string;
  count: StatCount;
  /** Appended to the count, e.g. "/mo". */
  unit?: string;
  /** Spoken after the exact count, e.g. "GitHub stars". */
  description: string;
};

export function StatBadge({
  icon,
  href,
  name,
  count,
  unit = "",
  description,
}: StatBadgeProps) {
  return (
    <a
      href={href}
      aria-label={count == null ? name : `${count} ${description}`}
      className="inline-flex items-center gap-2 font-mono text-label text-muted-foreground transition-colors hover:text-foreground"
    >
      <SimpleIcon icon={icon} size="small" />
      <span className="tabular-nums">
        {count == null ? "—" : `${formatCount(count)}${unit}`}
      </span>
    </a>
  );
}
