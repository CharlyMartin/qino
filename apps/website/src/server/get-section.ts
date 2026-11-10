import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { z } from "zod";

import { sectionCollection } from "../../qino/sections";
import { serializeMdx } from "./serialize-mdx";

export const getSection = createServerFn({ method: "GET" })
  .validator(z.string())
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: slug }) => {
    const { title, markdown } = await sectionCollection.getEntry(slug);
    return { title, mdx: await serializeMdx(markdown) };
  });
