"use client";

import {
  Fragment,
  type ComponentPropsWithRef,
  type JSX,
  type ReactNode,
} from "react";
import { type RowAction } from "@lib/row_action";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { ScrollArea } from "@components/ui/scroll-area";
import Progress from "@components/ui/progress";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import FormInputField from "./input_field";
import FormTagInput from "./tag_input";
import FormSelectField from "./field_select";
import FormCalendarField from "./calender_field";
import type z from "zod";
import {
  type InferZodType,
  type InferZodTypeOrUndefined,
} from "@lib/infer_zod_schema";

interface GenericFormContainerProps<
  T extends z.ZodType,
  U extends z.ZodType | undefined = undefined,
> extends Omit<ComponentPropsWithRef<typeof Dialog>, "children"> {
  /** Row action that drives add / update / loading mode. */
  rowAction: RowAction<InferZodType<T>, InferZodTypeOrUndefined<U>> | null;

  /**
   * Form instance from the caller's own `useAppForm`.
   *
   * Typed as `any` on purpose: TanStack Form's `useAppForm` produces a form whose
   * shape depends on the field/form components the caller registered. Letting the
   * caller own that hook is what makes new field components (FormInput, FormSelect,
   * FormTextArea, Switch, ...) extensible without touching this container.
   */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;

  /** Titles shown in the sheet header for each action mode. */
  titles: {
    add: string;
    update: string;
    read: string;
  };

  /** Submit button labels. Defaults to "Create" for add and "Update" for update. */
  submitLabels?: {
    add?: string;
    update?: string;
    read?: string;
  };

  /** Form fields, typically rendered as `<form.AppField>...</form.AppField>` blocks. */
  children: ReactNode;
}

export const { fieldContext, formContext } = createFormHookContexts();

// ─── Base field / form components ────────────────────────────────────────────

const BASE_FIELD_COMPONENTS = {
  /* eslint-disable @typescript-eslint/naming-convention */
  FormInputField,
  FormTagInput,
  FormSelectField,
  FormCalendarField,
  /* eslint-enable @typescript-eslint/naming-convention */
} as const;

const BASE_FORM_COMPONENTS = {
  /* eslint-disable @typescript-eslint/naming-convention */
  Button,
  /* eslint-enable @typescript-eslint/naming-convention */
} as const;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function create_app_form<
  TExtraFields extends Record<string, React.ComponentType<unknown>> = Record<
    never,
    never
  >,
>(options?: { extraFieldComponents?: TExtraFields }) {
  return createFormHook({
    fieldComponents: {
      ...BASE_FIELD_COMPONENTS,
      ...(options?.extraFieldComponents ?? {}),
    },
    formComponents: BASE_FORM_COMPONENTS,
    fieldContext,
    formContext,
  });
}

export default function GenericFormContainer<
  T extends z.ZodType,
  U extends z.ZodType | undefined = undefined,
>({
  rowAction,
  form,
  titles,
  submitLabels,
  children,
  ...sheetProps
}: GenericFormContainerProps<T, U>): JSX.Element {
  const header_title =
    rowAction?.action === "add"
      ? titles.add
      : rowAction?.action === "update" || rowAction?.action === "bulkupdate"
        ? titles.update
        : rowAction?.action === "read"
          ? titles.read
          : "";

  const submit_label =
    rowAction?.action === "add"
      ? (submitLabels?.add ?? "Create")
      : rowAction?.action === "update" || rowAction?.action === "bulkupdate"
        ? (submitLabels?.update ?? "Update")
        : (submitLabels?.read ?? "Ok");

  return (
    <Dialog
      {...sheetProps}
      onOpenChange={(open, e) => {
        sheetProps.onOpenChange?.(open, e);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        form.reset();
      }}
    >
      <DialogContent className="flex h-[80dvh] w-full max-w-[95vw] flex-col sm:max-w-2xl md:min-w-2xl lg:min-w-4xl">
        <DialogHeader>
          <DialogTitle className={"text-center"}>{header_title}</DialogTitle>
          <DialogDescription className="sr-only">
            Form to {header_title}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          {rowAction?.action === "loading" ? (
            <div className="flex h-full items-center justify-center">
              <Progress />
            </div>
          ) : (
            <ScrollArea className="text-foreground! h-full">
              <form
                className="space-y-4.5 px-3 py-1"
                onSubmit={async (formEvent) => {
                  formEvent.preventDefault();
                  formEvent.stopPropagation();
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  await form.handleSubmit();
                }}
              >
                {children}
              </form>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="mt-auto">
          <form.Subscribe
            selector={(state: {
              canSubmit: boolean;
              isSubmitting: boolean;
            }) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({
              canSubmit,
              isSubmitting,
            }: {
              canSubmit: boolean;
              isSubmitting: boolean;
            }) => (
              <Fragment>
                <DialogTrigger
                  render={
                    <Button type="button" variant={"outline"}>
                      Cancel
                    </Button>
                  }
                />

                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  onClick={async () => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    await form.handleSubmit();
                  }}
                >
                  {submit_label}
                </Button>
              </Fragment>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
