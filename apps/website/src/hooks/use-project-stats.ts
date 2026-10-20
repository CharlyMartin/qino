import { useEffect, useState } from "react";

import { fetchProjectStats } from "@/lib/fetch-project-stats";
import type { ProjectStats } from "@/types/project-stats";

/** Starts from the build-time snapshot, then refreshes with live counts. */
export function useProjectStats(initialStats: ProjectStats) {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    const controller = new AbortController();

    fetchProjectStats({ signal: controller.signal }).then((next) => {
      if (controller.signal.aborted) return;
      setStats((current) => ({
        stars: next.stars ?? current.stars,
        downloads: next.downloads ?? current.downloads,
      }));
    });

    return function cleanup() {
      controller.abort();
    };
  }, []);

  return stats;
}
