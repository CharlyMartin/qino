import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import { postCollection } from "../../qino/posts";

export const getPosts = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(async () => {
    const posts = await postCollection.getEntries();

    return posts.map(({ _meta, _stats, title, description, publishedOn }) => ({
      slug: _meta.slug,
      title,
      description,
      publishedOn,
      _stats,
    }));
  });
