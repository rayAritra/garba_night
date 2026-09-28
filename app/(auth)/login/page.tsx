import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  session: "Sign in to keep going.",
  verification: "That link expired or was already used. Sign in, or request a new reset link.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <AuthShell
      title={
        <>
          Back on the <span className="serif text-[42px] text-saffron">floor.</span>
        </>
      }
      lede="Sign in to see who’s swiping before the music starts."
    >
      <LoginForm notice={typeof error === "string" ? NOTICES[error] : undefined} />
    </AuthShell>
  );
}
