import { expect, test } from "vitest";

import { installBoxToMarkdown } from "./install-box-to-markdown";

function render(props: Record<string, unknown>) {
  return installBoxToMarkdown({ props, children: "", entry: {} } as never);
}

test.each([
  [{}, "npm install @qino/cms zod"],
  [{ command: "install" }, "npm install @qino/cms zod"],
  [{ command: "build" }, "npx qino build"],
  [
    { command: "skill" },
    "npx skills add CharlyMartin/qino --skill set-up-qino-cms",
  ],
])("turns %j into its npm command", (props, command) => {
  expect(render(props)).toBe(`\`\`\`sh\n${command}\n\`\`\``);
});

test.each([{ command: "deploy" }, { command: "constructor" }, { command: 1 }])(
  "keeps %j as written",
  (props) => {
    expect(render(props)).toBeNull();
  },
);
