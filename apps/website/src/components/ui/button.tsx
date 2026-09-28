import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-sm border whitespace-nowrap outline-none transition-colors select-none motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-border-strong bg-transparent text-foreground-2 hover:border-muted-foreground hover:text-foreground",
        ghost: "border-transparent text-muted-foreground hover:text-foreground",
        divided:
          "border-transparent border-l-border text-muted-foreground hover:bg-surface hover:text-foreground",
      },
      size: {
        default: "gap-2 px-5 py-3 text-sm font-bold",
        sm: "gap-1 px-1 py-1.5 text-xs font-medium md:px-2",
        icon: "size-6",
        block: "aspect-square h-full rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = Omit<ButtonPrimitive.Props, "className"> &
  VariantProps<typeof buttonVariants>;

function Button({ variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={buttonVariants({ variant, size })}
      {...props}
    />
  );
}

export { Button, buttonVariants };
