import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { z } from "zod";

import { sectionCollection } from "../../qino/sections";
import { serializeMdx } from "./serialize-mdx";

export const getSection = createServerFn({ method: "GET" })
  .validator(z.string())
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: slug }) => {
    const { title, signature, markdown } =
      await sectionCollection.getEntry(slug);
    return { title, signature, mdx: await serializeMdx(markdown) };
  });
