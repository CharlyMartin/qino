// Runs the three agent-readiness scanners against a deploy and prints one
// line per content check: `node apps/website/scripts/scan-agent-readiness.mjs
// <url> [path...]`. acceptmarkdown checks `/` and each path. The APIs and
// check ids are documented in docs/agents/agent-readiness-scanners.md. Exits
// 1 when a check fails or a scanner can't be reached; a warning doesn't count.
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

// is-agentic lists only the checks that failed or passed partially: one it
// doesn't list passed or didn't apply.
async function scanIsAgentic() {
  const { stdout } = await promisify(execFile)(
    "npx",
    ["-y", "is-agentic", host, "--json"],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  const report = JSON.parse(stdout);
  const issues = new Map(report.issues.map((issue) => [issue.id, issue]));
  return [
    "markdown-negotiation-vary",
    "agent-friendly-404",
    "agent-instruction",
  ].map((check) => ({
    check,
    status: issues.get(check)?.result ?? "pass",
    detail:
      issues.get(check)?.details ?? `not listed, scanned ${report.scanned_at}`,
  }));
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
// isitagentready and acceptmarkdown say `fail`; is-agentic says `failed` or
// `partial`.
const failed = results.some(({ status }) =>
  ["fail", "failed", "partial", "error"].includes(status),
);
process.exit(failed ? 1 : 0);
