import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import { testimonialCollection } from "../../qino/testimonials";

export const getTestimonials = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(async () => {
    const testimonials = await testimonialCollection.getEntries();

    return testimonials.map(({ name, title, company, quote, image, url }) => ({
      name,
      title,
      company,
      quote,
      image,
      url,
    }));
  });
