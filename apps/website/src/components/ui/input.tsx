import { Input as InputPrimitive } from "@base-ui/react/input";

type InputProps = Omit<InputPrimitive.Props, "className">;

export function Input(props: InputProps) {
  return (
    <InputPrimitive
      data-slot="input"
      className="w-full min-w-0 rounded-sm border border-input bg-transparent px-3 py-2.5 text-foreground outline-none transition-colors font-medium placeholder:text-placeholder motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive"
      {...props}
    />
  );
}
