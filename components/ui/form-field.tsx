"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";

export const inputClass =
  "h-14 w-full rounded-md border border-white/8 bg-surface px-[18px] text-base text-ink transition-[border-color,box-shadow,background-color] duration-150 outline-none focus:border-saffron/55 focus:bg-focus-field focus:shadow-[0_0_0_4px_rgba(255,181,71,.1)] aria-invalid:border-danger/60 disabled:opacity-60";

type FieldShellProps = { label: string; hint?: ReactNode; error?: string | null; id: string; children: ReactNode; className?: string; optional?: boolean };

function FieldShell({ label, hint, error, id, children, className, optional }: FieldShellProps) {
  return (
    <div className={cn("group flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold text-ink/70 transition-colors group-focus-within:text-[#FFC97A]">
        {label}
        {optional ? <span className="font-normal text-ink/40"> · optional</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="m-0 text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="m-0 text-[13px] text-ink/46">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type FieldProps = { label: string; hint?: ReactNode; error?: string | null; optional?: boolean; containerClassName?: string };

export function FormField({ label, hint, error, optional, containerClassName, className, id: idProp, ...props }: ComponentProps<"input"> & FieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} className={containerClassName} optional={optional}>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} className={cn(inputClass, className)} {...props} />
    </FieldShell>
  );
}

export function PasswordField({ label, hint, error, containerClassName, className, id: idProp, ...props }: Omit<ComponentProps<"input">, "type"> & FieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} className={containerClassName}>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(inputClass, "pr-14", className)}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1.5 right-1.5 flex size-11 items-center justify-center rounded-sm text-ink/60 hover:text-ink"
        >
          {visible ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
        </button>
      </div>
    </FieldShell>
  );
}

export function TextAreaField({ label, hint, error, optional, containerClassName, className, id: idProp, ...props }: ComponentProps<"textarea"> & FieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} className={containerClassName} optional={optional}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(inputClass, "h-auto min-h-28 resize-none py-4 leading-normal", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, optional, containerClassName, className, id: idProp, children, ...props }: ComponentProps<"select"> & FieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} className={containerClassName} optional={optional}>
      <select id={id} aria-invalid={error ? true : undefined} className={cn(inputClass, "appearance-none bg-[length:16px] bg-[right_18px_center] bg-no-repeat pr-12", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23F4F1EC99' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")" }} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}

/** Accessible on/off switch (role=switch) matching the Settings design. */
export function Switch({ checked, onChange, labelledBy, label, disabled }: { checked: boolean; onChange: (next: boolean) => void; labelledBy?: string; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex h-[26px] w-11 shrink-0 rounded-full p-[3px] transition-colors duration-200 disabled:opacity-50",
        // Visual size is 44×26; the ::before extends the hit area to 44×44.
        "before:absolute before:-inset-y-[9px] before:inset-x-0 before:content-['']",
        checked ? "accent-gradient" : "bg-white/14",
      )}
    >
      <span className={cn("size-5 rounded-full bg-ink shadow-[0_2px_6px_rgba(0,0,0,.4)] transition-transform duration-200", checked && "translate-x-[18px]")} />
    </button>
  );
}
