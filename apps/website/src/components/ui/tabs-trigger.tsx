import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

type TabsTriggerProps = Omit<TabsPrimitive.Tab.Props, "className">;

export function TabsTrigger(props: TabsTriggerProps) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className="rounded-sm px-2.5 py-1.5 font-mono text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground data-active:bg-surface data-active:text-foreground motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:px-3 md:py-1.5"
      {...props}
    />
  );
}
