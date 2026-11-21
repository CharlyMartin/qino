import { initQino } from "@qino/cms";

import { site } from "../src/lib/site";

export default initQino({
  contentFolder: "content",
  mediaFolder: "public",
  siteUrl: site.url,
  // Writes public/llms.txt, llms-full.txt and index.md from content/llms.md.
  cli: { build: { llmsTxt: true } },
});
