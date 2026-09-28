import { Tabs } from "@/components/ui/tabs";
import { TabsContent } from "@/components/ui/tabs-content";
import { TabsList } from "@/components/ui/tabs-list";
import { TabsTrigger } from "@/components/ui/tabs-trigger";
import {
  getInstallCommands,
  type PackageManager,
  packageManagers,
} from "@/lib/get-install-commands";
import { usePackageManager } from "@/lib/use-package-manager";
import { CommandLine } from "./command-line";

type InstallBoxProps = {
  withBuild?: boolean;
};

export function InstallBox({ withBuild = false }: InstallBoxProps) {
  const [packageManager, setPackageManager] = usePackageManager();

  return (
    <div className="rounded-sm border text-left">
      <Tabs
        value={packageManager}
        onValueChange={(value) => setPackageManager(value as PackageManager)}
      >
        <div className="border-b">
          <TabsList
            aria-label={
              withBuild
                ? "Install and build package manager"
                : "Install package manager"
            }
            activateOnFocus
          >
            {packageManagers.map((manager) => (
              <TabsTrigger key={manager} value={manager}>
                {manager}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {packageManagers.map((manager) => {
          const { install, build } = getInstallCommands(manager);
          return (
            <TabsContent key={manager} value={manager}>
              <CommandLine command={install} copyLabel="Copy install command" />
              {withBuild && (
                <div className="border-t">
                  <CommandLine
                    tone="build"
                    command={build}
                    copyLabel="Copy build command"
                  />
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
