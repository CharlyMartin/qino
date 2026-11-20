import { describe, expect, test } from "vitest";

import { replaceComponents } from "./replace-components";

const entry = { title: "Hello" };

describe("replaceComponents", () => {
  test("replaces inline components where they are, without indenting", async () => {
    expect(
      await replaceComponents({
        body: "Run <Cmd /> now.\n",
        components: { Cmd: () => "`a`\n`b`" },
        entry,
      }),
    ).toBe("Run `a`\n`b` now.\n");
  });

  test("keeps fragments and their tags, replacing what's inside", async () => {
    expect(
      await replaceComponents({
        body: "<>\n  <A />\n</>\n",
        components: { A: () => "a" },
        entry,
      }),
    ).toBe("<>\n  a\n</>\n");
  });

  test("keeps a component named after an object method that the map lacks", async () => {
    expect(
      await replaceComponents({
        body: "<constructor />\n",
        components: {},
        entry,
      }),
    ).toBe("<constructor />\n");
  });

  test("leaves a body that isn't valid MDX as written", async () => {
    const body = "<!-- note -->\n\n<A />\n";

    expect(
      await replaceComponents({ body, components: { A: () => "a" }, entry }),
    ).toBe(body);
  });
});
