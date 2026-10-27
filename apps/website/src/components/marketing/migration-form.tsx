import { CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { type SubmitEvent, startTransition, useActionState } from "react";

import { Callout } from "@/components/marketing/callout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { githubRepoPattern } from "@/lib/github-repo-pattern";
import {
  type MigrationRequestState,
  requestMigration,
} from "@/lib/request-migration";

const initialState: MigrationRequestState = { done: false };

type MigrationFormProps = {
  /** Prefills the repository field, as `owner/name`. */
  repo?: string;
};

export function MigrationForm({ repo }: MigrationFormProps) {
  const [state, submitAction, pending] = useActionState(
    requestMigration,
    initialState,
  );

  // Submits through `onSubmit`, not `action`, so React doesn't clear the fields when it fails.
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const fd = new FormData(event.currentTarget);
    startTransition(() => submitAction(fd));
  }

  if (state.done) {
    return (
      <Callout role="status" icon={CheckCircleIcon} title="Got it">
        I'll look at your repo and email {state.email ?? "you"} with a fixed
        scope.
      </Callout>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          name="name"
          aria-label="Name"
          placeholder="Name"
          autoComplete="name"
          required
        />
        <Input
          name="email"
          type="email"
          aria-label="Work email"
          placeholder="Work email"
          autoComplete="email"
          required
        />
        <Input
          name="repository"
          aria-label="GitHub repository"
          placeholder="GitHub repository, e.g. acme/website"
          defaultValue={repo}
          pattern={githubRepoPattern}
          title="owner/name or a GitHub URL, e.g. acme/website"
          required
        />
        <Input
          name="website"
          aria-label="Website (optional)"
          placeholder="Website (optional)"
        />
        {/* formcarry's honeypot: hidden from people, filled in by bots. */}
        <input
          name="_gotcha"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />
        <Button type="submit" disabled={pending}>
          Send my repo
        </Button>
      </form>
      {state.errorText && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {state.errorText}
        </p>
      )}
    </div>
  );
}
