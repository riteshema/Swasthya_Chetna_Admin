"use client";

import { type FormProps } from "@type/index";
import { useMemo, type JSX } from "react";
import GenericFormContainer, {
  create_app_form,
} from "./fields/generic_form_container";
import { QuerySchema } from "@dto/query_type";

import {
  User,
  MessageSquare,
  Clock,
  Activity,
} from "lucide-react";

export default function QueryForm({
  rowAction,
  onSubmit,
  ...props
}: Readonly<FormProps<typeof QuerySchema, undefined>>): JSX.Element {
  const { useAppForm } = create_app_form();

  const form = useAppForm({
    defaultValues: useMemo(() => {
      const is_loaded = rowAction && rowAction.action !== "loading";
      const r = is_loaded ? rowAction.row : undefined;

      return {
        id: r?.id ?? 0,

        full_name: r?.full_name ?? "",
        contact_method: r?.contact_method ?? "",
        email: r?.email ?? "",
        whatsapp_number: r?.whatsapp_number ?? "",

        inquiry_about: r?.inquiry_about ?? "",

        preferred_time: r?.preferred_time ?? "",
        time_from: r?.time_from ?? "",
        time_to: r?.time_to ?? "",

        status: r?.status ?? "pending",
        admin_reply: r?.admin_reply ?? "",

        replied_at: r?.replied_at ?? new Date(),
        created_at: r?.created_at ?? new Date(),
        updated_at: r?.updated_at ?? new Date(),

        user_id: r?.user_id ?? "",
      };
    }, [rowAction]),

    onSubmit: async ({ value }) => {
      if (rowAction?.action === "update") {
        onSubmit({
          action: "update",
          index: rowAction.index,
          row: { ...rowAction.row, ...value },
        });
      }

      props.onOpenChange?.(false, {} as never);
    },
  });

  return (
    <GenericFormContainer
      form={form}
      rowAction={rowAction}
      titles={{ add: "Add Query", update: "Edit Query", read: "View Query" }}
      submitLabels={{ update: "Save Changes" }}
      {...props}
    >
      <div className="flex flex-col gap-6 w-full">

        {/* BASIC INFO */}
        <div className="rounded-lg border px-4 py-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <User className="size-4 text-blue-500" /> Query Info
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <form.AppField name="full_name">
              {(f) => (
                <f.FormInputField
                  label="Full Name"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>

            <form.AppField name="email">
              {(f) => (
                <f.FormInputField
                  label="Email"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>

            <form.AppField name="whatsapp_number">
              {(f) => (
                <f.FormInputField
                  label="WhatsApp Number"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>

            <form.AppField name="contact_method">
              {(f) => (
                <f.FormInputField
                  label="Contact Method"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
          </div>
        </div>

        {/* INQUIRY */}
        <div className="rounded-lg border px-4 py-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="size-4 text-green-500" /> Inquiry
          </div>

          <div className="grid grid-cols-1 gap-4">
            <form.AppField name="inquiry_about">
              {(f) => (
                <f.FormInputField
                  label="Inquiry About"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
          </div>
        </div>

        {/* TIME */}
        <div className="rounded-lg border px-4 py-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="size-4 text-orange-500" /> Preferred Time
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <form.AppField name="preferred_time">
              {(f) => (
                <f.FormInputField
                  label="Preferred Time"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>

            <form.AppField name="time_from">
              {(f) => (
                <f.FormInputField
                  label="Time From"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>

            <form.AppField name="time_to">
              {(f) => (
                <f.FormInputField
                  label="Time To"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
          </div>
        </div>

        {/* STATUS */}
        <div className="rounded-lg border px-4 py-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="size-4 text-purple-500" /> Status
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <form.AppField name="status">
              {(f) => (
                <f.FormSelectField
                  label="Status"
                  defaultValue={f.state.value ?? "pending"}
                  options={[
                    { name: "Pending", value: "pending" },
                    { name: "In Progress", value: "in_progress" },
                    { name: "Resolved", value: "resolved" },
                    { name: "Rejected", value: "rejected" },
                  ]}
                  onChange={(v) => f.handleChange(v as never)}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>

            <form.AppField name="admin_reply">
              {(f) => (
                <f.FormInputField
                  label="Admin Reply"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
          </div>
        </div>

      </div>
    </GenericFormContainer>
  );
}