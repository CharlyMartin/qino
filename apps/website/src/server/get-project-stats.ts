import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import { fetchProjectStats } from "@/lib/fetch-project-stats";

/** Build-time snapshot, refreshed in the browser by `useProjectStats`. */
export const getProjectStats = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(() => fetchProjectStats({ githubToken: process.env.GITHUB_TOKEN }));
