"use client";

import { type JSX, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@lib/utils";
import ErrorField from "./error_field";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";
import { Calendar } from "@components/ui/calendar"; 

interface FormCalendarFieldProps {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function FormCalendarField({
  label,
  value,
  onChange,
  placeholder,
  error,
  required = true,
  disabled = false,
}: Readonly<FormCalendarFieldProps>): JSX.Element {
  const input_label = useMemo(
    () => `${label}${required ? " *" : ""}`,
    [label, required],
  );

  const formatted_value = value ? format(value, "dd-MM-yyyy") : "";

  return (
    <div className="w-full flex-1 space-y-1 transition-all duration-150">
      <Label className={cn(error ? "text-destructive" : "", "pt-4 pb-1")}>
        {input_label}
      </Label>
      <Popover>
        <PopoverTrigger className="w-full" disabled={disabled}>
          <Input
            readOnly
            type="text"
            disabled={disabled}
            value={formatted_value}
            placeholder={placeholder ?? "Select date"}
            className={cn(
              "cursor-pointer",
              error ? "border-destructive placeholder:text-destructive" : "",
            )}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(date) => onChange(date ?? null)}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
      <ErrorField error={error} />
    </div>
  );
}