import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-7 lg:px-12">
        <Link
          to="/"
          aria-label="Qino home"
          className="text-xl font-extrabold tracking-tight"
        >
          Qino
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-6 text-sm font-medium text-muted-foreground"
        >
          <Link to="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <Link
            to="/docs/$"
            params={{ _splat: "examples" }}
            className="hidden hover:text-foreground md:inline"
          >
            Examples
          </Link>
          <a
            href="https://github.com/CharlyMartin/qino"
            className="inline-flex items-center gap-1 text-primary hover:text-foreground"
          >
            GitHub <ArrowUpRightIcon className="size-3" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
