// Runs the three agent-readiness scanners against a deploy and prints one
// line per content check: `node apps/website/scripts/scan-agent-readiness.mjs
// <url> [path...]`. acceptmarkdown checks `/` and each path. The APIs and
// check ids are documented in docs/agents/agent-readiness-scanners.md. Exits
// 1 when a check fails or a scanner can't be reached. acceptmarkdown's
// warnings don't count.
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const [url, ...paths] = process.argv.slice(2);
if (!URL.canParse(url ?? "")) {
  console.error("usage: scan-agent-readiness.mjs <url> [path...]");
  process.exit(2);
}
const { origin, host } = new URL(url);

async function postJson(endpoint, body) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${endpoint} answered ${response.status}`);
  return response;
}

async function scanIsItAgentReady() {
  const response = await postJson("https://isitagentready.com/api/scan", {
    url: origin,
    enabledChecks: ["linkHeaders", "markdownNegotiation"],
  });
  const { checks } = await response.json();
  if (!checks) throw new Error("isitagentready answered without checks");
  return [
    ["linkHeaders", checks.discoverability.linkHeaders.status],
    [
      "markdownNegotiation",
      checks.contentAccessibility.markdownNegotiation.status,
    ],
  ].map(([check, status]) => ({ check, status }));
}

async function scanAcceptMarkdown(path) {
  const response = await postJson("https://acceptmarkdown.com/api/readiness", {
    url: new URL(path, origin).href,
  });
  // Server-sent events: one `check` event per check.
  const events = (await response.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice("data:".length)));
  const checks = events
    .filter((event) => event.id && event.status)
    .map(({ id, status }) => ({ check: id, status }));
  if (checks.length == 0)
    throw new Error("acceptmarkdown answered without checks");
  return checks;
}

// The is-agentic checks agent-ready content covers. The score counts only the
// first three so far.
const IS_AGENTIC_CHECKS = [
  "markdown-negotiation-vary",
  "agent-friendly-404",
  "agent-instruction",
  "markdown-frontmatter",
  "llms-txt-exists",
  "llms-txt-formatting",
  "llms-txt-links-resolve",
  "modular-llms-txt",
  "content-no-js",
];

// The CLI scans the host when it has no report yet. Its `issues` leave out
// checks the score doesn't count, failed or not, so each check's status is
// read from the scan page, which embeds every check of that report.
async function scanIsAgentic() {
  const { stdout } = await promisify(execFile)(
    "npx",
    ["-y", "is-agentic", host, "--json"],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  const { scanned_at } = JSON.parse(stdout);
  const response = await fetch(`https://is-agentic.com/scan/${host}`);
  if (!response.ok) {
    throw new Error(`is-agentic's scan page answered ${response.status}`);
  }
  // The checks sit in the page's escaped JSON, as
  // `{"id":"…","name":"…",…,"status":"…","details":"…"`.
  const page = (await response.text()).replaceAll('\\"', '"');
  return IS_AGENTIC_CHECKS.map((check) => {
    const start = page.indexOf(`{"id":"${check}","name":`);
    if (start == -1) {
      throw new Error(`is-agentic's scan page has no check "${check}"`);
    }
    const next = page.indexOf('{"id":"', start + 1);
    const fields = page.slice(start, next == -1 ? undefined : next);
    const status = fields.match(/"status":"(\w+)"/)?.[1] ?? "unknown";
    const details = fields.match(/"details":"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
    return {
      check,
      // `warning` is partial credit; `na` means the check didn't run.
      status: { warning: "partial", na: "not-run" }[status] ?? status,
      detail: `${details.slice(0, 120)} (scanned ${scanned_at})`,
    };
  });
}

// Each scanner's checks, or one `error` line when it can't be reached.
async function run(scanner, scan) {
  try {
    return (await scan()).map((result) => ({ scanner, ...result }));
  } catch (error) {
    return [{ scanner, check: "-", status: "error", detail: error.message }];
  }
}

const results = (
  await Promise.all([
    run("isitagentready", scanIsItAgentReady),
    ...["/", ...paths].map((path) =>
      run(`acceptmarkdown ${path}`, () => scanAcceptMarkdown(path)),
    ),
    run("is-agentic", scanIsAgentic),
  ])
).flat();
for (const { scanner, check, status, detail } of results) {
  console.log(
    [scanner.padEnd(32), check.padEnd(26), status, detail]
      .filter((part) => part != undefined)
      .join(" "),
  );
}
// isitagentready, acceptmarkdown and is-agentic say `fail`. An is-agentic
// check that gets partial credit, didn't run, or can't be read fails too.
const failed = results.some(({ status }) =>
  ["fail", "partial", "not-run", "unknown", "error"].includes(status),
);
process.exit(failed ? 1 : 0);
