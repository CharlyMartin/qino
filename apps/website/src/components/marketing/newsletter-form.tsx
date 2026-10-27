import { CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { type SubmitEvent, startTransition, useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type NewsletterState,
  subscribeToNewsletter,
} from "@/lib/subscribe-to-newsletter";
import { Callout } from "./callout";

const initialState: NewsletterState = { done: false };

export function NewsletterForm() {
  const [state, submitAction, pending] = useActionState(
    subscribeToNewsletter,
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
      <div className="max-w-lg mx-auto">
        <Callout
          role="status"
          icon={CheckCircleIcon}
          title="You're on the list"
        >
          We'll email {state.email ?? "you"} when early access opens, with beta
          pricing locked in.
        </Callout>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
        <Input
          name="fi-sender-fullName"
          aria-label="Name"
          placeholder="Name"
          autoComplete="name"
          required
        />
        <Input
          name="fi-sender-email"
          type="email"
          aria-label="Email"
          placeholder="Email"
          autoComplete="email"
          required
        />
        {/* Forminit's honeypot: hidden from people, filled in by bots. */}
        <input
          name="_gotcha"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />
        <Button type="submit" disabled={pending}>
          Get early access
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
