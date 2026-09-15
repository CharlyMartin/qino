import type { AnyCollection } from "../../types/collection";
import type { AnyTree } from "../../types/tree";
import { generateTypes } from "./generate-types";

type BuildParams = {
  collections: Array<AnyCollection>;
  trees: Array<AnyTree>;
};

export async function build({ collections, trees }: BuildParams) {
  await generateTypes({ collections, trees });
}
