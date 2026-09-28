import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      back="/login"
      title={
        <>
          Lost your <span className="serif text-[42px] text-saffron">step?</span>
        </>
      }
      lede="Enter your email and we’ll send a link to set a new password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
