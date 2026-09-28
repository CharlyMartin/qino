import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

type TabsListProps = Omit<TabsPrimitive.List.Props, "className">;

export function TabsList(props: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className="inline-flex items-center"
      {...props}
    />
  );
}
