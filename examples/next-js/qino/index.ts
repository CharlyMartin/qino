import { initQino } from "@qino/cms";

export default initQino({
  contentFolder: "src/content",
  mediaFolder: "public",
  cloud: {
    publish: { mode: "open_pull_request", reviewBeforePublish: true },
    media: {
      accepted: [
        { type: "image/webp", maxSize: "5MB" },
        { type: "image/png", maxSize: "5MB" },
      ],
    },
  },
});
