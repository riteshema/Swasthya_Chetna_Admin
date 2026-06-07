import { cn } from "@lib/utils";
import { type JSX } from "react";

interface ErrorFieldProps {
  error?: string;
  className?: string;
}

/**
 * A reusable form error component that reserves space to avoid layout shift.
 * Always renders with fixed height, shows text only if error is present.
 */
export default function ErrorField({
  error,
  className,
}: ErrorFieldProps): JSX.Element {
  const has_error = Boolean(error);

  return (
    <p
      className={cn(
        `text-destructive h-1 text-xs ${has_error ? "visible" : "invisible"}`,
        className,
      )}
      aria-live="polite"
    >
      {error ?? "placeholder"}
    </p>
  );
}
