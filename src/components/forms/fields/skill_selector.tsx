"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { type ReactNode, useState, type JSX, useMemo } from "react";
import { cn } from "@lib/utils";
import { Badge } from "@components/ui/badge";
import ErrorField from "./error_field";
import { Label } from "@components/ui/label";
interface SkillSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  default_skills: string[];
  prefix_icon?: ReactNode;
  error?: string;
  show_label?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
}
export default function SkillSelector({
  value,
  onChange,
  default_skills,
  prefix_icon,
  error,
  show_label = true,
  placeholder,
  label,
  required = true,
}: Readonly<SkillSelectorProps>): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);
  const [skills, setSkills] = useState<string[]>(default_skills);
  const [input, setInput] = useState<string>("");

  function toggle_skill(skill: string): void {
    if (value.includes(skill)) {
      onChange(value.filter((s) => s !== skill));
    } else {
      onChange([...value, skill]);
    }
  }

  function remove_skill(skill: string): void {
    onChange(value.filter((s) => s !== skill));
  }

  function add_custom_skill(): void {
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    if (!skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }

    if (!value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }

    setInput("");
  }

  const input_placeholder = useMemo(
    () =>
      placeholder
        ? `${placeholder} ${show_label && value.length === 0 ? "" : required ? "*" : ""}`
        : undefined,
    [placeholder, required, show_label, value],
  );

  const input_label = useMemo(
    () =>
      show_label
        ? label
          ? `${label} ${required ? "*" : ""}`
          : value.length !== 0 && input_placeholder
            ? input_placeholder
            : ""
        : "",
    [input_placeholder, label, required, show_label, value],
  );

  return (
    <div className="flex flex-col">
      <Label
        className={
          !show_label
            ? "hidden"
            : `${error ? "text-destructive" : ""} pt-4 pb-1`
        }
      >
        {input_label}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <div
            role="combobox"
            aria-expanded={open}
            className={cn(
              `border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring text-sm", error && "border-destructive flex min-h-10 w-full cursor-pointer items-center justify-between rounded-md border`,
            )}
          >
            <div className="flex h-full w-full items-center">
              {prefix_icon !== undefined && (
                <div
                  className={cn(
                    `text-muted-foreground flex shrink-0 items-center justify-center pr-1 pl-3`,
                    error && `text-destructive fill-destructive`,
                  )}
                >
                  {prefix_icon}
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-wrap gap-1 px-2 py-1.5">
                {value.length === 0 && (
                  <div
                    className={cn(
                      `text-muted-foreground flex shrink-0 items-center justify-center`,
                      error && `text-destructive fill-destructive`,
                    )}
                  >
                    {placeholder}
                  </div>
                )}

                {value.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="gap-1 whitespace-nowrap"
                  >
                    {skill}
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        remove_skill(skill);
                      }}
                    >
                      <X className="hover:text-destructive h-3 w-3 cursor-pointer" />
                    </span>
                  </Badge>
                ))}
              </div>
            </div>

            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-75 p-0">
          <Command>
            <CommandInput
              placeholder="Add custom skill"
              value={input}
              onValueChange={setInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add_custom_skill();
                }
              }}
            />
            <CommandGroup>
              <CommandItem disabled>
                <span className="text-muted-foreground text-xs">
                  After adding a new skill, press Enter
                </span>
              </CommandItem>
            </CommandGroup>
            <CommandEmpty>No skills found.</CommandEmpty>

            <CommandGroup heading={placeholder}>
              {skills.map((skill) => {
                const selected = value.includes(skill);

                return (
                  <CommandItem
                    key={skill}
                    value={skill}
                    onSelect={() => toggle_skill(skill)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />

                    {skill}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <ErrorField error={error} />
    </div>
  );
}
