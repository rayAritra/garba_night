"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { forgotPassword, login, resetPassword, signUp, type ActionState } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormField, PasswordField } from "@/components/ui/form-field";

function Submit({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" block loading={pending}>
      {children}
    </Button>
  );
}

function Message({ state }: { state: ActionState }) {
  if (state.error)
    return (
      <p role="alert" className="m-0 rounded-md border border-danger/30 bg-rose/10 px-4 py-3 text-sm text-danger">
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p role="status" className="m-0 rounded-md border border-saffron/30 bg-saffron/10 px-4 py-3 text-sm text-saffron-soft">
        {state.success}
      </p>
    );
  return null;
}

/** 0–4 bars: length, mixed case, digit, symbol. */
function strength(password: string) {
  if (password.length < 8) return password ? 1 : 0;
  return 1 + [/[a-z]/.test(password) && /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
}

function StrengthMeter({ password }: { password: string }) {
  const score = strength(password);
  const label = ["", "too short", "okay", "good", "strong"][score];
  return (
    <div className="-mt-2 flex gap-1.5" role="img" aria-label={password ? `Password strength: ${label}` : "Password strength"}>
      {[1, 2, 3, 4].map((bar) => (
        <span key={bar} className={cn("h-[3px] flex-1 rounded-sm transition-colors", bar <= score ? (score === 1 ? "bg-danger" : "bg-saffron") : "bg-white/10")} />
      ))}
    </div>
  );
}

const formClass = "mt-8 flex flex-col gap-4";
const footerClass = "pb-safe mt-auto flex flex-col gap-4 pt-8 sm:pb-8";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action] = useActionState(login, {});
  return (
    <form action={action} className="flex flex-1 flex-col">
      <div className={formClass}>
        {notice && !state.error ? <p className="m-0 rounded-md border border-white/10 bg-white/4 px-4 py-3 text-sm text-ink/70">{notice}</p> : null}
        <FormField label="Email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.fields?.email} />
        <PasswordField label="Password" name="password" autoComplete="current-password" required minLength={8} />
        <Link href="/forgot-password" className="-mt-1 self-end py-2 text-sm font-semibold text-saffron no-underline hover:text-saffron-soft">
          Forgot password?
        </Link>
        <Message state={state} />
      </div>
      <div className={footerClass}>
        <Submit>Sign in</Submit>
        <p className="m-0 text-center text-sm text-ink/60">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-saffron no-underline hover:text-saffron-soft">
            Create an account
          </Link>
        </p>
      </div>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signUp, {});
  const [password, setPassword] = useState("");
  if (state.success) {
    return (
      <div className={formClass}>
        <Message state={state} />
        <Link href="/login" className="text-sm font-semibold text-saffron no-underline">
          Back to sign in
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-1 flex-col">
      <div className={formClass}>
        <FormField label="Name" name="name" autoComplete="given-name" required minLength={2} maxLength={60} defaultValue={state.fields?.name} />
        <FormField label="Email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.fields?.email} />
        <PasswordField label="Password" name="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters." />
        <StrengthMeter password={password} />
        <Message state={state} />
      </div>
      <div className={footerClass}>
        <Submit>Create account</Submit>
        <p className="m-0 text-center text-xs leading-normal text-ink/46">18+ only. By joining you agree to keep the floor kind and respectful.</p>
        <p className="m-0 text-center text-sm text-ink/60">
          Already in?{" "}
          <Link href="/login" className="font-semibold text-saffron no-underline hover:text-saffron-soft">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPassword, {});
  return (
    <form action={action} className="flex flex-1 flex-col">
      <div className={formClass}>
        <FormField label="Email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.fields?.email} />
        <Message state={state} />
      </div>
      <div className={footerClass}>
        <Submit>Send reset link</Submit>
        <Link href="/login" className="self-center py-2 text-sm font-semibold text-saffron no-underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPassword, {});
  const [password, setPassword] = useState("");
  return (
    <form action={action} className="flex flex-1 flex-col">
      <div className={formClass}>
        <PasswordField label="New password" name="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
        <StrengthMeter password={password} />
        <Message state={state} />
        {state.error ? (
          <Link href="/forgot-password" className="text-sm font-semibold text-saffron no-underline">
            Request a new reset link
          </Link>
        ) : null}
      </div>
      <div className={footerClass}>
        <Submit>Save password</Submit>
      </div>
    </form>
  );
}
