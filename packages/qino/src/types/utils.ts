import type z from "zod";

import type { JSON_PATH_ARRAY } from "../data";
import type { ExtensionSchema } from "../schemas/lock-file";
import type { ResolveOption } from "./resolve";

export type SupportedFileExtension = z.infer<typeof ExtensionSchema>;

export type JsonPathArray = typeof JSON_PATH_ARRAY;

export type GenericPath = `/${string}`;

export type GetterOptions<R extends ResolveOption = ResolveOption> = {
  resolveRelations?: R;
};
