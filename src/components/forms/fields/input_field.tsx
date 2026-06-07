"use client";

import { type JSX, type ReactNode, useMemo, useState } from "react";
import ErrorField from "./error_field";
import { Label } from "@components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@components/ui/input-group";
import { EyeClosedIcon, EyeIcon } from "lucide-react";

interface FormInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  type?: "text" | "number" | "email" | "password" | "tel" | "time";
  required?: boolean;
  minLength?: number;
  prefix_icon?: ReactNode;
  show_label?: boolean;
  disabled?: boolean;
  is_read_only?: boolean;
}

export default function FormInputField({
  placeholder,
  label,
  error,
  required = true,
  value,
  minLength,
  type,
  onChange,
  prefix_icon,
  show_label = true,
  disabled = false,
  is_read_only = false,
}: Readonly<FormInputFieldProps>): JSX.Element {
  const [show_password, set_show_password] = useState<boolean>(false);

  const input_placeholder = useMemo(
    () =>
      placeholder
        ? `${placeholder} ${show_label && value.trim().length === 0 ? "" : required ? "*" : ""}`
        : undefined,
    [placeholder, required, show_label, value],
  );

  const input_label = useMemo(
    () =>
      show_label
        ? label
          ? `${label} ${required ? "*" : ""}`
          : value.trim().length !== 0 && input_placeholder
            ? input_placeholder
            : ""
        : "",
    [input_placeholder, label, required, show_label, value],
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
        {input_label}
      </Label>
      <InputGroup className={error ? "border-destructive" : ""}>
        <InputGroupInput
          type={
            type === "password" ? (show_password ? "text" : "password") : type
          }
          disabled={disabled}
          minLength={minLength}
          value={value ?? ""}
          placeholder={
            value.trim().length === 0 ? input_placeholder : undefined
          }
          onChange={(event) => onChange(event.target.value)}
          className={
            error ? "border-destructive placeholder:text-destructive" : ""
          }
          readOnly={is_read_only}
        />
        <InputGroupAddon
          hidden={prefix_icon === undefined}
          className={error ? "text-destructive fill-destructive" : ""}
        >
          {prefix_icon}
        </InputGroupAddon>
        <InputGroupButton
          size={"icon-sm"}
          hidden={type !== "password"}
          onClick={() => {
            set_show_password(!show_password);
          }}
        >
          {show_password ? <EyeClosedIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroup>
      <ErrorField error={error} />
    </div>
  );
}
