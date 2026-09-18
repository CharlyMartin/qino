import { z } from "zod";

import qino from "./index";

export const releaseCollection = qino.defineCollection({
  directory: "/releases",
  extension: ".md",
  schema: z
    .object({
      version: z.stringFormat(
        "version",
        /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
      ),
      date: z.iso.date(),
      summary: z.string(),
      markdown: z.string(),
    })
    .strict(),
});
