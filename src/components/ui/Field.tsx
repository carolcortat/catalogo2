import clsx from "clsx";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-muted">(opcional)</span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const control =
  "w-full rounded-xl border bg-surface px-3.5 text-base placeholder:text-muted/70 transition " +
  "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60";

interface BaseProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export function Input({
  label,
  id,
  error,
  hint,
  optional,
  className,
  ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint} optional={optional}>
      <input
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(control, "h-12", error ? "border-red-500" : "border-line", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function Textarea({
  label,
  id,
  error,
  hint,
  optional,
  className,
  rows = 3,
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint} optional={optional}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(control, "py-3", error ? "border-red-500" : "border-line", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function Select({
  label,
  id,
  error,
  hint,
  optional,
  className,
  children,
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint} optional={optional}>
      <select
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(control, "h-12", error ? "border-red-500" : "border-line", className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
