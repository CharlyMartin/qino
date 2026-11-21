import { initQino } from "@qino/cms";

export default initQino({
  contentFolder: "src/content",
  mediaFolder: "public",
  // Where agent Markdown links point: the dev server, as the example runs locally.
  siteUrl: "http://localhost:3000",
  cloud: {
    publish: {
      mode: "open_pull_request",
      reviewBeforePublish: { bypassIfAdmin: true },
    },
  },
});
