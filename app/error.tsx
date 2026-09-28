"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <ErrorState
        body="Something went wrong on our side. Try again — if it keeps happening, head back home."
        action={
          <div className="flex flex-col items-center gap-2">
            <Button size="md" onClick={reset}>
              Try again
            </Button>
            <ButtonLink href="/" variant="ghost" size="sm">
              Go home
            </ButtonLink>
          </div>
        }
      />
    </main>
  );
}
