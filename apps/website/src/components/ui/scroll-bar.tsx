import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

type ScrollBarProps = Omit<ScrollAreaPrimitive.Scrollbar.Props, "className">;

export function ScrollBar({
  orientation = "vertical",
  ...props
}: ScrollBarProps) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className="m-0.5 flex touch-none select-none rounded-full p-0.5 data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:w-2.5"
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border-strong hover:bg-muted-foreground"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}
