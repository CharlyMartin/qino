import { cva, type VariantProps } from "class-variance-authority";
import type { SimpleIcon as Icon } from "simple-icons";

const iconVariants = cva("w-auto shrink-0 text-foreground-2", {
  variants: {
    size: {
      default: "h-5",
      small: "h-3.5",
      // Scales with the surrounding text and sits on its baseline.
      inline: "inline-block h-[0.875em] align-[-0.125em]",
    },
  },
  defaultVariants: { size: "default" },
});

type SimpleIconProps = VariantProps<typeof iconVariants> & {
  icon: Pick<Icon, "path">;
  /** Crop to the glyph bounds so icons can share a height. */
  viewBox?: string;
};

export function SimpleIcon({
  icon,
  viewBox = "0 0 24 24",
  size,
}: SimpleIconProps) {
  return (
    <svg
      viewBox={viewBox}
      fill="currentColor"
      className={iconVariants({ size })}
      aria-hidden="true"
    >
      <path d={icon.path} />
    </svg>
  );
}
