import type { ComponentProps } from "react";

import { InstallBox } from "../landing/install-box";

type DocsInstallBoxProps = ComponentProps<typeof InstallBox>;

export function DocsInstallBox(props: DocsInstallBoxProps) {
  return (
    <div className="not-prose my-6">
      <InstallBox {...props} />
    </div>
  );
}
