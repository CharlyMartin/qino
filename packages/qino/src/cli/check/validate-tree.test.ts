import { consola } from "consola";
import { afterEach, describe, expect, test, vi } from "vitest";

import { makeDummyNode, makeDummyTree } from "../../utils/tests";
import { validateTree } from "./validate-tree";

describe("validateTree", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("resolves when getTree succeeds", async () => {
    const warn = vi.spyOn(consola, "warn").mockImplementation(() => {});
    const tree = makeDummyTree({ directory: "/pages", extension: ".md" });
    tree.getTree = (async () => [
      makeDummyNode({ slug: "home", extension: ".md" }),
    ]) as typeof tree.getTree;

    await expect(validateTree(tree)).resolves.toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  test("warns when the tree is empty", async () => {
    const warn = vi.spyOn(consola, "warn").mockImplementation(() => {});
    const tree = makeDummyTree({ directory: "/pages", extension: ".md" });

    await validateTree(tree);

    expect(warn).toHaveBeenCalledWith(`Tree "/pages" is empty.`);
  });

  test("wraps getTree errors with the tree directory", async () => {
    const tree = makeDummyTree({ directory: "/pages", extension: ".md" });
    tree.getTree = (async () => {
      throw new Error("invalid node");
    }) as typeof tree.getTree;

    await expect(validateTree(tree)).rejects.toThrow(
      `Tree "/pages" failed validation: invalid node`,
    );
  });
});
