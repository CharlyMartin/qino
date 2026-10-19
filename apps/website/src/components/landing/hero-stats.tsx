import { siGithub, siNpm } from "simple-icons";

import { version } from "../../../../../packages/cms/package.json";

import { useProjectStats } from "@/hooks/use-project-stats";
import { externalLinks } from "@/lib/external-links";
import { formatVersion } from "@/lib/format-version";
import type { ProjectStats } from "@/types/project-stats";
import { DotSeparator } from "./dot-separator";
import { SimpleIcon } from "./simple-icon";
import { StatBadge } from "./stat-badge";

type HeroStatsProps = {
  stats: ProjectStats;
};

export function HeroStats({ stats }: HeroStatsProps) {
  const { stars, downloads } = useProjectStats(stats);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 md:justify-center">
      <a
        href={externalLinks.npm}
        aria-label={`@qino/cms v${formatVersion(version)} on npm`}
        className="inline-flex items-center gap-2 font-mono text-label text-muted-foreground transition-colors hover:text-foreground"
      >
        <SimpleIcon icon={siNpm} size="small" />v{formatVersion(version)}
      </a>
      <DotSeparator />
      <StatBadge
        icon={siGithub}
        href={externalLinks.github}
        name="GitHub"
        count={stars}
        description="GitHub stars"
      />
      <DotSeparator />
      <StatBadge
        icon={siNpm}
        href={externalLinks.npm}
        name="npm"
        count={downloads}
        unit="/mo"
        description="npm downloads last month"
      />
    </div>
  );
}
