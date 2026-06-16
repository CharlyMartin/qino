import type { AnyCollection, AnyTree } from "../../types";
import { generateTypes } from "./generate-types";

type BuildParams = {
  collections: Array<AnyCollection>;
  trees: Array<AnyTree>;
};

export async function build({ collections, trees }: BuildParams) {
  await generateTypes({ collections, trees });
}
