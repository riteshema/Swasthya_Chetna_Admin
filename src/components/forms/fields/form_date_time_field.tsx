"use client";

import { useMemo, useState, type JSX, type ReactNode } from "react";
import { format, fromZonedTime, toZonedTime } from "date-fns-tz";
import ErrorField from "./error_field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";
import { Label } from "@components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@components/ui/input-group";
import { Calendar } from "@components/ui/calendar";
import { Input } from "@components/ui/input";
import { set } from "date-fns";

interface FormDateTimeFieldProps {
  value: Date;
  onChange: (value: Date) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  prefix_icon?: ReactNode;
  show_label?: boolean;
  disabled?: boolean;
}
const time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
export default function FormDateTimeField({
  value,
  onChange,
  label,
  error,
  required = true,
  disabled = false,
  placeholder,
  prefix_icon,
  show_label = true,
}: Readonly<FormDateTimeFieldProps>): JSX.Element {
  const [open, set_open] = useState<boolean>(false);
  const time = useMemo(() => {
    if (value) {
      return format(value, "HH:mm");
    }
    return format(new Date(), "HH:mm");
  }, [value]);

  const display = useMemo(() => {
    if (!value) {
      return "";
    }
    return format(value, "MM/dd/yyyy  hh:mm aa");
  }, [value]);

  const input_label = useMemo(
    () => (show_label ? (label ? `${label} ${required ? "*" : ""}` : "") : ""),
    [label, required, show_label],
  );

  const merge = (date: Date, t: string): Date => {
    const [h, m] = t.split(":").map(Number);
    return fromZonedTime(
      set(toZonedTime(date, time_zone), {
        hours: isNaN(h) ? 0 : h,
        minutes: isNaN(m) ? 0 : m,
        seconds: 0,
        milliseconds: 0,
      }),
      time_zone,
    );
  };
  return (
    <div className="flex-1 space-y-1 transition-all duration-150">
      <Label
        className={
          !show_label
            ? "hidden"
            : `${error ? "text-destructive" : ""} pt-4 pb-1`
        }
      >
        {input_label}
      </Label>
      <Popover open={open} onOpenChange={set_open}>
        <PopoverTrigger>
          <div className="w-full" onClick={() => set_open(true)}>
            <InputGroup
              className={`w-full ${error ? "border-destructive" : ""}`}
            >
              <InputGroupInput
                required={required}
                readOnly
                disabled={disabled}
                value={display}
                placeholder={
                  placeholder ??
                  `Select ${label?.toLowerCase() ?? "date & time"}`
                }
                className={`cursor-pointer ${error ? "border-destructive placeholder:text-destructive" : ""}`}
              />
              <InputGroupAddon className={error ? "text-destructive" : ""}>
                {prefix_icon}
              </InputGroupAddon>
            </InputGroup>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              if (!d) {
                return;
              }
              onChange(merge(d, time));
              if (d) {
                set_open(false);
              }
            }}
            className="p-0"
          />
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <span className="text-muted-foreground text-xs">Time</span>
            <Input
              type="time"
              value={time}
              onChange={(e) => {
                onChange(merge(value, e.target.value));
              }}
              className="h-8 flex-1 rounded-md border px-2 text-sm outline-none focus:ring-1"
            />
          </div>
        </PopoverContent>
      </Popover>
      <ErrorField error={error} />
    </div>
  );
}
