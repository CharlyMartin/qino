import { getRouter } from "../router";

// Whether a route renders the path. Dynamic ones, such as `/blog/$slug`, can still 404.
export function hasPageRoute(pathname: string) {
  // Matching is fuzzy: a partial match leaves the unmatched rest in `**`.
  const [, rawParams, foundRoute] = getRouter().getMatchedRoutes(pathname);
  return foundRoute != null && !("**" in rawParams);
}
