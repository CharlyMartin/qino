import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-7 lg:px-12">
        <Link
          to="/"
          aria-label="qino home"
          className="text-xl font-extrabold tracking-tight"
        >
          qino
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-6 text-sm font-medium text-muted-foreground"
        >
          <Link to="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <Link to="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <Link to="/cloud" className="text-primary hover:text-foreground">
            Cloud
          </Link>
        </nav>
      </div>
    </header>
  );
}
