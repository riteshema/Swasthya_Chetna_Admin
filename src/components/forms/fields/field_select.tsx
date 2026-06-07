"use client";

import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { type JSX } from "react";
import ErrorField from "./error_field";

type SelectOptionValue = string | number | boolean;

interface FormSelectFieldProps {
  label: string;
  options: Array<{
    name: string;
    value: SelectOptionValue;
    key?: string;
  }>;
  defaultValue: SelectOptionValue;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: SelectOptionValue | null) => void;
}

export default function FormSelectField({
  label,
  options,
  defaultValue,
  error,
  required = true,
  disabled,
  onChange,
}: Readonly<FormSelectFieldProps>): JSX.Element {
  const selected_value = String(defaultValue);

  return (
    <div className={`h-fit flex-1 transition-all duration-150`}>
      <div className="flex w-full flex-col items-start space-y-2 space-x-3">
        <Label className={`${error ? "text-destructive" : ""} pt-4`}>
          {label}
          {required ? " *" : ""}
        </Label>
        <Select
          disabled={disabled}
          value={selected_value}
          onValueChange={(value) => {
            const selected_option = options.find(
              (option) => String(option.value) === value,
            );
            onChange(selected_option?.value ?? null);
          }}
        >
          <SelectTrigger
            className={`w-full ${error ? "border-destructive" : ""}`}
          >
            <SelectValue>
              {options.filter((e) => e.value === defaultValue)[0]?.name ??
                selected_value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map(({ name, value, key }) => (
              <SelectItem key={key ?? String(value)} value={String(value)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ErrorField error={error} />
    </div>
  );
}
