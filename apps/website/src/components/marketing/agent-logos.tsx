import {
  siClaude,
  siCursor,
  siGithubcopilot,
  siGooglegemini,
  siOpencode,
} from "simple-icons";

import { codexIcon } from "@/lib/codex-icon";
import { SimpleIcon } from "./simple-icon";

const agents = [
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
      {agents.map((agent) => (
        <li key={agent.slug} title={agent.title}>
          <SimpleIcon icon={agent} />
          <span className="sr-only">{agent.title}</span>
        </li>
      ))}
    </ul>
  );
}
