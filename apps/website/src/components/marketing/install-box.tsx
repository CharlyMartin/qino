import { Tabs } from "@/components/ui/tabs";
import { TabsContent } from "@/components/ui/tabs-content";
import { TabsList } from "@/components/ui/tabs-list";
import { TabsTrigger } from "@/components/ui/tabs-trigger";
import {
  getInstallCommands,
  type InstallCommand,
  type PackageManager,
  packageManagers,
} from "@/lib/get-install-commands";
import { usePackageManager } from "@/lib/use-package-manager";
import { CommandLine } from "./command-line";

const labels = {
  install: "Install",
  build: "Build",
  skill: "Skill install",
} satisfies Record<InstallCommand, string>;

type InstallBoxProps = {
  command?: InstallCommand | Array<InstallCommand>;
};

export function InstallBox({ command = "install" }: InstallBoxProps) {
  const [packageManager, setPackageManager] = usePackageManager();
  const lines = Array.isArray(command) ? command : [command];

  return (
    <div className="rounded-sm border text-left">
      <Tabs
        value={packageManager}
        onValueChange={(value) => setPackageManager(value as PackageManager)}
      >
        <div className="border-b">
          <TabsList
            aria-label={`${lines.map((line) => labels[line]).join(" and ")} package manager`}
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
          const commands = getInstallCommands(manager);
          return (
            <TabsContent key={manager} value={manager}>
              <div className="divide-y">
                {lines.map((line) => (
                  <CommandLine
                    key={line}
                    tone={line == "build" ? "build" : "install"}
                    command={commands[line]}
                    copyLabel={`Copy ${labels[line].toLowerCase()} command`}
                  />
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
