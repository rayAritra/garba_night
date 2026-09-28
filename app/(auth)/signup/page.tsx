import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <AuthShell
      title={
        <>
          Save your spot
          <br />
          on the <span className="serif text-[42px] text-saffron">floor.</span>
        </>
      }
      lede="Takes a minute. The music waits for no one."
    >
      <SignupForm />
    </AuthShell>
  );
}
