"use client";

import { Fragment, type JSX, useMemo } from "react";
import ErrorField from "./error_field";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";

interface FormTextAreaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  min_length?: number;
  max_length?: number;
  rows?: number;
  show_label?: boolean;
  disabled?: boolean;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

export default function FormTextAreaInput({
  placeholder,
  label,
  error,
  required = true,
  value,
  min_length,
  max_length,
  rows = 4,
  onChange,
  show_label = true,
  disabled = false,
  resize = "vertical",
}: Readonly<FormTextAreaInputProps>): JSX.Element {
  const textarea_placeholder = useMemo(
    () =>
      placeholder
        ? `${placeholder} ${show_label && value.trim().length === 0 ? "" : required ? "*" : ""}`
        : undefined,
    [placeholder, show_label, value, required],
  );

  const textarea_label = useMemo(
    () =>
      show_label
        ? label
          ? `${label} ${required ? "*" : ""}`
          : value.trim().length !== 0 && textarea_placeholder
            ? textarea_placeholder
            : ""
        : "",
    [show_label, label, required, value, textarea_placeholder],
  );

  return (
    <div className={`flex-1 space-y-1 transition-all duration-150`}>
      <Label
        className={
          !show_label
            ? "hidden"
            : `${error ? "text-destructive" : ""} pt-4 pb-1`
        }
      >
        {textarea_label}
      </Label>
      <Textarea
        rows={rows}
        disabled={disabled}
        minLength={min_length}
        maxLength={max_length}
        value={value ?? ""}
        placeholder={
          value.trim().length === 0 ? textarea_placeholder : undefined
        }
        onChange={(event) => onChange(event.target.value)}
        className={`${error ? "border-destructive placeholder:text-destructive" : ""} ${
          resize === "none"
            ? "resize-none"
            : resize === "horizontal"
              ? "resize-x"
              : resize === "vertical"
                ? "resize-y"
                : "resize"
        }`}
      />
      {max_length ? (
        <div
          className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"} text-right`}
        >
          {value.length}/{max_length}
        </div>
      ) : (
        <Fragment />
      )}
      <ErrorField error={error} />
    </div>
  );
}
