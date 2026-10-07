import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { z } from "zod";

import { postCollection } from "../../qino/posts";
import { serializeMdx } from "./serialize-mdx";

export const getPost = createServerFn({ method: "GET" })
  .validator(z.string())
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: slug }) => {
    const slugs = await postCollection.getAllSlugs();
    if (!slugs.includes(slug)) throw notFound();

    const { title, description, publishedOn, wordCount, markdown } =
      await postCollection.getEntry(slug);

    return {
      title,
      description,
      publishedOn,
      wordCount,
      mdx: await serializeMdx(markdown),
    };
  });
