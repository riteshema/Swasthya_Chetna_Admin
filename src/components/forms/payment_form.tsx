"use client";

import { type FormProps } from "@type/index";
import { useMemo, type JSX } from "react";
import GenericFormContainer, {
  create_app_form,
} from "./fields/generic_form_container";
import { PaymentSchema } from "@dto/payment_type";
import { CreditCard, Info } from "lucide-react";

export default function PaymentEditForm({
  rowAction,
  onSubmit,
  ...props
}: Readonly<FormProps<typeof PaymentSchema, undefined>>): JSX.Element {
  const { useAppForm } = create_app_form();

  const form = useAppForm({
    defaultValues: useMemo(() => {
      const is_loaded = rowAction && rowAction.action !== "loading";
      const r = is_loaded ? rowAction.row : undefined;

      return {
        id: r?.id ?? 0,
        transaction_id: r?.transaction_id ?? "",
        user_id: r?.user_id ?? "",
        payment_method: r?.payment_method ?? "",
        payment_amount: r?.payment_amount ?? 0,
        payment_reason: r?.payment_reason ?? "",
        approve: r?.approve ?? false,
        created_at: r?.created_at ?? "",
        full_name: r?.full_name ?? "",
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
      titles={{ add: "Add Payment", update: "Edit Payment", read: "View Payment" }}
      submitLabels={{ update: "Save Changes" }}
      {...props}
    >
      <div className="space-y-4">
        <div className="rounded-lg border px-4 py-3 space-y-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Info className="size-4 text-blue-500" /> Payment Details
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <form.AppField name="transaction_id">
              {(f) => (
                <f.FormInputField
                  label="Transaction ID"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>

            <form.AppField name="payment_method">
              {(f) => (
                <f.FormSelectField
                  label="Payment Method"
                  defaultValue={f.state.value}
                  options={[
                    { name: "UPI", value: "upi" },
                    { name: "Bank Transfer", value: "bank_transfer" },
                    { name: "Card", value: "card" },
                    { name: "Cash", value: "cash" },
                    { name: "Other", value: "other" },
                  ]}
                  onChange={(v) => f.handleChange(v as never)}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>

            <form.AppField name="payment_amount">
              {(f) => (
                <f.FormInputField
                  label="Amount (₹)"
                  type="number"
                  value={String(f.state.value)}
                  onChange={(v) => f.handleChange(Number(v))}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>

            <form.AppField name="payment_reason">
              {(f) => (
                <f.FormInputField
                  label="Reason"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
          </div>
        </div>

        <div className="rounded-lg border px-4 py-3 space-y-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="size-4 text-emerald-500" /> Approval
          </p>
          <form.AppField name="approve">
            {(f) => (
              <f.FormSelectField
                label="Status"
                defaultValue={String(f.state.value)}
                options={[
                  { name: "Approve", value: "true" },
                  { name: "Reject", value: "false" },
                ]}
                onChange={(v) => f.handleChange(v === "true")}
                error={f.state.meta.errors[0]}
              />
            )}
          </form.AppField>
        </div>
      </div>
    </GenericFormContainer>
  );
}