import type { SimpleIcon as Icon } from "simple-icons";

type SimpleIconProps = {
  icon: Icon;
};

export function SimpleIcon({ icon }: SimpleIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-8 w-12 shrink-0 text-foreground"
      aria-hidden="true"
    >
      <path d={icon.path} />
    </svg>
  );
}
