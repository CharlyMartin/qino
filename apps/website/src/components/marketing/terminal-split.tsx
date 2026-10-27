const install = "$ npm install\n";
const peerError = ' peer next@"^12 || ^13"\n  from next-contentlayer@0.3.4';
const build =
  "$ qino build\n✔ All content passes schema validation.\n✔ qino build done!";

// Real output: the npm error from contentlayer#605, and qino's own CLI strings.
export function TerminalSplit() {
  return (
    <div className="grid overflow-hidden rounded-sm border text-left font-mono text-sm md:grid-cols-2 md:divide-x">
      <div className="border-b p-4 md:border-b-0 md:p-5">
        <p className="text-label uppercase text-muted-foreground">Before</p>
        <pre className="mt-3 overflow-x-auto text-foreground-3">
          <code>
            {install}
            <span className="text-destructive">npm ERR!</span>
            {peerError}
          </code>
        </pre>
      </div>
      <div className="p-4 md:p-5">
        <p className="text-label uppercase text-primary">After</p>
        <pre className="mt-3 overflow-x-auto text-foreground-2">
          <code>{build}</code>
        </pre>
      </div>
    </div>
  );
}
