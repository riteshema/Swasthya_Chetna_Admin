import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { PlusIcon, XIcon } from "lucide-react";
import { type JSX, useState } from "react";
import { v4 as uuid } from "uuid";
import ErrorField from "./error_field";

interface Tag {
  id: string;
  name: string;
}

interface FormTagInputProps {
  name?: string;
  error?: string;
  value: Array<Tag>;
  onChange: (tags: Array<Tag>) => void;
}

export default function FormTagInput({
  name,
  value,
  onChange,
  error,
}: Readonly<FormTagInputProps>): JSX.Element {
  const [input_value, set_input_value] = useState<string>("");

  function add_tag(trimmed_value: string): void {
    if (trimmed_value.length === 0) {
      return;
    }
    if (
      value.some(
        (tag) => tag.name.toLowerCase() === trimmed_value.toLowerCase(),
      )
    ) {
      return;
    }
    onChange([
      ...value,
      {
        id: String(uuid()),
        name: trimmed_value,
      },
    ]);
  }

  return (
    <div className={"space-y-3"}>
      <Label>{name}</Label>
      <div className={"flex flex-wrap gap-2"}>
        {value.map((tag) => {
          return (
            <div
              key={tag.id}
              className={
                "border-primary bg-primary/10 flex space-x-2 rounded-full border px-2 py-1 text-xs"
              }
            >
              <span className={"block"}>{tag.name}</span>
              <XIcon
                className={
                  "border-destructive text-destructive bg-destructive/10 size-4 rounded-full border"
                }
                onClick={() => {
                  onChange(value.filter((t) => t.id !== tag.id));
                }}
              />
            </div>
          );
        })}
      </div>
      <div className={"flex items-center space-x-3"}>
        <Input
          maxLength={20}
          value={input_value}
          onChange={(e) => {
            set_input_value(e.target.value);
          }}
          onKeyUp={(e) => {
            if (e.code.toLowerCase() === "enter") {
              const trimmed_value = input_value.trim();
              add_tag(trimmed_value);
              set_input_value("");
            }
          }}
        />
        <Button
          disabled={input_value.trim().length === 0}
          size={"icon"}
          onClick={() => {
            const trimmed_value = input_value.trim();
            add_tag(trimmed_value);
            set_input_value("");
          }}
        >
          <PlusIcon />
        </Button>
      </div>
      <ErrorField error={error} />
    </div>
  );
}
