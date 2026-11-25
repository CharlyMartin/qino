import {
  siClaude,
  siCursor,
  siGithubcopilot,
  siGooglegemini,
  siOpencode,
} from "simple-icons";

import { codexIcon } from "@/lib/codex-icon";
import { SimpleIcon } from "./simple-icon";

const agentIcons = [
  siClaude,
  codexIcon,
  siCursor,
  siGithubcopilot,
  siGooglegemini,
  siOpencode,
];

export function AgentLogos() {
  return (
    <ul
      aria-label="Agents"
      className="flex flex-wrap items-center gap-x-6 gap-y-4"
    >
      {agentIcons.map((icon) => (
        <li key={icon.slug} title={icon.title}>
          <SimpleIcon icon={icon} />
          <span className="sr-only">{icon.title}</span>
        </li>
      ))}
    </ul>
  );
}
