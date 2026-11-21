import { initQino } from "@qino/cms";

import { site } from "../src/lib/site";

export default initQino({
  contentFolder: "content",
  mediaFolder: "public",
  siteUrl: site.url,
});
