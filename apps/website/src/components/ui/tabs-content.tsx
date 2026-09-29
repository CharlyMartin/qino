import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

type TabsContentProps = Omit<TabsPrimitive.Panel.Props, "className">;

export function TabsContent(props: TabsContentProps) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      {...props}
    />
  );
}
