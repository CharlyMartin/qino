import type { SimpleIcon as Icon } from "simple-icons";

type SimpleIconProps = {
  icon: Icon;
  /** Crop to the glyph bounds so icons can share a height. */
  viewBox?: string;
};

export function SimpleIcon({ icon, viewBox = "0 0 24 24" }: SimpleIconProps) {
  return (
    <svg
      viewBox={viewBox}
      fill="currentColor"
      className="h-5 w-auto shrink-0 text-foreground-2"
      aria-hidden="true"
    >
      <path d={icon.path} />
    </svg>
  );
}
