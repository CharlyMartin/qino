import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import { postCollection } from "../../qino/posts";
import { readLatestPost } from "./read-latest-post";

/** The newest post, for the hero. `null` before the first post. */
export const getLatestPost = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(() => readLatestPost(postCollection));
