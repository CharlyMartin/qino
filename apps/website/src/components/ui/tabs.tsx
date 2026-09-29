import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

type TabsProps = Omit<TabsPrimitive.Root.Props, "className">;

export function Tabs(props: TabsProps) {
  return <TabsPrimitive.Root data-slot="tabs" className="min-w-0" {...props} />;
}
