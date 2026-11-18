import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import changelog from "../../../../packages/cms/CHANGELOG.md?raw";
import { parseChangelog } from "../lib/parse-changelog";

export const getLatestReleases = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(() => parseChangelog(changelog).slice(0, 3));
