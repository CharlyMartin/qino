import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogDescription } from "@/components/ui/dialog-description";
import { DialogTitle } from "@/components/ui/dialog-title";
import { DialogTrigger } from "@/components/ui/dialog-trigger";
import { externalLinks } from "@/lib/external-links";
import { installPrompt } from "@/lib/install-prompt";
import { AgentLogos } from "./agent-logos";
import { ButtonLink } from "./button-link";
import { ExternalButtonLink } from "./external-button-link";
import { PromptBox } from "./prompt-box";

export function InstallPromptDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>View install prompt</DialogTrigger>
      <DialogContent>
        <div className="space-y-3">
          <DialogTitle>Install with your agent.</DialogTitle>
          <DialogDescription>
            Copy this prompt into Claude Code, Codex, Cursor or any coding
            agent.
          </DialogDescription>
        </div>
        <AgentLogos />
        <PromptBox prompt={installPrompt} copyLabel="Copy install prompt" />
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <ExternalButtonLink
            href={externalLinks.skill}
            variant="ghost"
            size="inline"
          >
            View on skills.sh
            <ArrowUpRightIcon className="size-4" aria-hidden="true" />
          </ExternalButtonLink>
          <ButtonLink to="/docs" variant="ghost" size="inline">
            Read the docs
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </DialogContent>
    </Dialog>
  );
}
