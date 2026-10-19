import { z } from "zod";

import qino from "./index";

export const testimonialCollection = qino.defineCollection({
  directory: "testimonials",
  extension: ".json",
  schema: z
    .object({
      name: z.string(),
      title: z.string(),
      company: z.string(),
      quote: z.string(),
      image: z.string(),
      url: z.url(),
    })
    .strict(),
});
