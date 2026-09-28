import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "New password" };

// Reached from the emailed reset link (via /auth/callback) or from Settings while signed in.
export default function ResetPasswordPage() {
  return (
    <AuthShell
      back="/settings"
      title={
        <>
          Pick a new <span className="serif text-[42px] text-saffron">password.</span>
        </>
      }
      lede="At least 8 characters. You’ll stay signed in."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
