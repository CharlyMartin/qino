import { initQino } from "@qino/cms";

export default initQino({
  contentFolder: "src/content",
  mediaFolder: "public",
  cloud: {
    publish: {
      mode: "open_pull_request",
      reviewBeforePublish: { bypassIfAdmin: true },
    },
  },
});
