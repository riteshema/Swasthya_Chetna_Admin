"use client";

import { type FormProps } from "@type/index";
import { useMemo, type JSX } from "react";
import GenericFormContainer, {
  create_app_form,
} from "./fields/generic_form_container";
import { UserAdminSchema } from "@dto/user_type";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import {
  User,
  Mail,
  MapPin,
  Heart,
  Activity,
  Stethoscope,
  Building,
  CreditCard,
  Shield,
} from "lucide-react";

const YES_NO_OPTIONS = [
  { name: "Yes", value: "yes" },
  { name: "No", value: "no" },
];

export default function UserEditForm({
  rowAction,
  onSubmit,
  ...props
}: Readonly<FormProps<typeof UserAdminSchema, undefined>>): JSX.Element {
  const { useAppForm } = create_app_form();

  const form = useAppForm({
    defaultValues: useMemo(() => {
      const is_loaded = rowAction && rowAction.action !== "loading";
      const r = is_loaded ? rowAction.row : undefined;

      return {
        first_name: r?.first_name ?? "",
        middle_name: r?.middle_name ?? "",
        last_name: r?.last_name ?? "",
        dob: r?.dob ?? null,
        age: r?.age ?? null,
        gender: r?.gender ?? "",
        marital_status: r?.marital_status ?? "",
        education: r?.education ?? "",
        occupation: r?.occupation ?? "",
        designation: r?.designation ?? "",
        organization_email: r?.organization_email ?? "",
        organization_contact: r?.organization_contact ?? "",
        voter_id: r?.voter_id ?? "",
        aadhar_card: r?.aadhar_card ?? null,

        country: r?.country ?? "",
        state: r?.state ?? "",
        district: r?.district ?? "",
        area: r?.area ?? "",
        pincode: r?.pincode ?? "",
        landmark: r?.landmark ?? "",
        society: r?.society ?? "",
        house_number: r?.house_number ?? "",
        street_number: r?.street_number ?? "",

        role: r?.role ?? "user",
        role_is_active: r?.role_is_active ?? false,

        insurance_occupation: r?.insurance_occupation ?? "",
        annual_income: r?.annual_income ?? null,
        medical_insurance: r?.medical_insurance ?? "No",
        health_insurance_company: r?.health_insurance_company ?? "",
        sum_insure: r?.sum_insure ?? null,
        policy_name: r?.policy_name ?? "",
        premium_amount: r?.premium_amount ?? null,

        habit_exercise: r?.habit_exercise ?? "",
        food: r?.food ?? "",
        drinks: r?.drinks ?? "",
        intoxications: r?.intoxications ?? "",
        hobbies: r?.hobbies ?? "",
        likings: r?.likings ?? "",
        disliking: r?.disliking ?? "",
        life_goal: r?.life_goal ?? "",

        running: r?.running ?? "",
        walking: r?.walking ?? "",
        cycling: r?.cycling ?? "",
        fitness_exercise: r?.fitness_exercise ?? "no",
        competitive_sports_events: r?.competitive_sports_events ?? "no",
        paid_events: r?.paid_events ?? "no",
        regular_health_management: r?.regular_health_management ?? "no",
        donate_for_society_benefit: r?.donate_for_society_benefit ?? "no",
        invest_funds_in_company_shares:
          r?.invest_funds_in_company_shares ?? "no",
        donation_amount: r?.donation_amount ?? null,

        skin_disease: r?.skin_disease ?? "no",
        diabetes: r?.diabetes ?? "no",
        hypertension: r?.hypertension ?? "no",
        thyroidism: r?.thyroidism ?? "no",
        dyslipidemia: r?.dyslipidemia ?? "no",
        cancer: r?.cancer ?? "no",
        asthma: r?.asthma ?? "no",
        tuberculosis: r?.tuberculosis ?? "no",
        respiratory_infections: r?.respiratory_infections ?? "no",
        stress_depression_anxiety: r?.stress_depression_anxiety ?? "no",
        constipation_diarrhea: r?.constipation_diarrhea ?? "no",
        indigestion_acidity_flatulence:
          r?.indigestion_acidity_flatulence ?? "no",
        headache: r?.headache ?? "no",
        heart_related_problems: r?.heart_related_problems ?? "no",
        kidney_related_problems: r?.kidney_related_problems ?? "no",
        liver_related_problems: r?.liver_related_problems ?? "no",
        medical_timelines: {
          last_one_month: r?.medical_timelines?.last_one_month ?? null,
          last_three_month: r?.medical_timelines?.last_three_month ?? null,
          last_six_month: r?.medical_timelines?.last_six_month ?? null,
          last_twelve_month: r?.medical_timelines?.last_twelve_month ?? null,
        },
        bank_name: r?.bank_name ?? "",
        account_number: r?.account_number ?? "",
        ifsc: r?.ifsc ?? "",
        upi: r?.upi ?? "",
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
      titles={{ add: "Add User", update: "Edit User", read: "View User" }}
      submitLabels={{ update: "Save Changes" }}
      {...props}
    >
      <Accordion multiple className="w-full space-y-2">
        <AccordionItem value="personal" className="rounded-lg border px-4">
          <AccordionTrigger className="gap-2 text-sm font-semibold">
            <User className="size-4 text-blue-500" /> Personal Information
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            <form.AppField name="first_name">
              {(f) => (
                <f.FormInputField
                  label="First Name"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="middle_name">
              {(f) => (
                <f.FormInputField
                  label="Middle Name"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="last_name">
              {(f) => (
                <f.FormInputField
                  label="Last Name"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="age">
              {(f) => (
                <f.FormInputField
                  label="Age"
                  type="number"
                  value={String(f.state.value) ?? 0}
                  onChange={(v) => f.handleChange(Number(v))}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="gender">
              {(f) => (
                <f.FormSelectField
                  label="Gender"
                  defaultValue={f.state.value}
                  options={["Male", "Female", "Other"].map((v) => ({
                    name: v,
                    value: v,
                  }))}
                  onChange={(v) => f.handleChange(v as never)}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="marital_status">
              {(f) => (
                <f.FormSelectField
                  label="Marital Status"
                  defaultValue={f.state.value}
                  options={["Single", "Married", "Divorced", "Widowed"].map(
                    (v) => ({ name: v, value: v }),
                  )}
                  onChange={(v) => f.handleChange(v as never)}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="education">
              {(f) => (
                <f.FormInputField
                  label="Education"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="occupation">
              {(f) => (
                <f.FormInputField
                  label="Occupation"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="designation">
              {(f) => (
                <f.FormInputField
                  label="Designation"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="organization_email">
              {(f) => (
                <f.FormInputField
                  prefix_icon={<Mail />}
                  label="Organization Email"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="organization_contact">
              {(f) => (
                <f.FormInputField
                  label="Organization Contact"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="voter_id">
              {(f) => (
                <f.FormInputField
                  label="Voter ID"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="aadhar_card">
              {(f) => (
                <f.FormInputField
                  label="Aadhar Card"
                  value={String(f.state.value) ?? ""}
                  onChange={(v) => f.handleChange(Number(v))}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="address" className="rounded-lg border px-4">
          <AccordionTrigger className="gap-2 text-sm font-semibold">
            <MapPin className="size-4 text-rose-500" /> Address
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            {(
              [
                "country",
                "state",
                "district",
                "area",
                "pincode",
                "society",
                "house_number",
                "street_number",
                "landmark",
              ] as const
            ).map((field) => (
              <form.AppField key={field} name={field}>
                {(f) => (
                  <f.FormInputField
                    label={field
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                    value={f.state.value}
                    onChange={f.handleChange}
                    error={f.state.meta.errors[0]}
                  />
                )}
              </form.AppField>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="role" className="rounded-lg border px-4">
          <AccordionTrigger className="gap-2 text-sm font-semibold">
            <Shield className="size-4 text-violet-500" /> Role & Access
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            <form.AppField name="role">
              {(f) => (
                <f.FormSelectField
                  label="Role"
                  defaultValue={f.state.value ?? "user"}
                  options={[
                    "user",
                    "health_provider",
                    "educator",
                    "event_organiser",
                    "item_provider",
                    "quiz_maker",
                  ].map((v) => ({ name: v, value: v }))}
                  onChange={(v) => f.handleChange(v as never)}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="role_is_active">
              {(f) => (
                <f.FormSelectField
                  label="Is Active"
                  defaultValue={String(f.state.value)}
                  options={[
                    { name: "Active", value: "true" },
                    { name: "Inactive", value: "false" },
                  ]}
                  onChange={(v) => f.handleChange(v === "true")}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="insurance" className="rounded-lg border px-4">
          <AccordionTrigger className="gap-2 text-sm font-semibold">
            <Building className="size-4 text-emerald-500" /> Health Insurance
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            <form.AppField name="insurance_occupation">
              {(f) => (
                <f.FormInputField
                  label="Occupation"
                  value={String(f.state.value) ?? "0"}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="annual_income">
              {(f) => (
                <f.FormInputField
                  label="Annual Income"
                  type="number"
                  value={String(f.state.value) ?? "0"}
                  onChange={(v) => f.handleChange(Number(v))}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="medical_insurance">
              {(f) => (
                <f.FormSelectField
                  label="Medical Insurance"
                  defaultValue={f.state.value ?? "No"}
                  options={[
                    { name: "Yes", value: "Yes" },
                    { name: "No", value: "No" },
                  ]}
                  onChange={(v) => f.handleChange(v as never)}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="health_insurance_company">
              {(f) => (
                <f.FormInputField
                  label="Insurance Company"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="sum_insure">
              {(f) => (
                <f.FormInputField
                  label="Sum Insured"
                  type="number"
                  value={String(f.state.value) ?? "0"}
                  onChange={(v) => f.handleChange(Number(v))}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="policy_name">
              {(f) => (
                <f.FormInputField
                  label="Policy Name"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
            <form.AppField name="premium_amount">
              {(f) => (
                <f.FormInputField
                  label="Premium Amount"
                  type="number"
                  value={String(f.state.value) ?? ""}
                  onChange={(v) => f.handleChange(Number(v))}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="habits" className="rounded-lg border px-4">
          <AccordionTrigger className="gap-2 text-sm font-semibold">
            <Activity className="size-4 text-orange-500" /> Personal Habits
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            {(
              [
                "habit_exercise",
                "food",
                "drinks",
                "intoxications",
                "hobbies",
                "likings",
                "disliking",
              ] as const
            ).map((field) => (
              <form.AppField key={field} name={field}>
                {(f) => (
                  <f.FormInputField
                    label={field
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                    value={f.state.value}
                    onChange={f.handleChange}
                    error={f.state.meta.errors[0]}
                  />
                )}
              </form.AppField>
            ))}
            <form.AppField name="life_goal">
              {(f) => (
                <f.FormInputField
                  label="Life Goal"
                  value={f.state.value}
                  onChange={f.handleChange}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fitness" className="rounded-lg border px-4">
          <AccordionTrigger className="gap-2 text-sm font-semibold">
            <Heart className="size-4 text-red-500" /> Health & Fitness Survey
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            {(
              [
                ["running", "Running"],
                ["walking", "Walking"],
                ["cycling", "Cycling"],
                ["fitness_exercise", "Exercise"],
                ["competitive_sports_events", "Competitive Sports Events"],
                ["paid_events", "Paid Events"],
                ["regular_health_management", "Regular Health Management"],
                ["donate_for_society_benefit", "Donate for Society Benefit"],
                [
                  "invest_funds_in_company_shares",
                  "Invest Funds in Company Shares",
                ],
              ] as const
            ).map(([field, label]) => (
              <form.AppField key={field} name={field}>
                {(f) => (
                  <f.FormSelectField
                    label={label}
                    defaultValue={f.state.value ?? "no"}
                    options={YES_NO_OPTIONS}
                    onChange={(v) => f.handleChange(v as never)}
                    error={f.state.meta.errors[0]}
                  />
                )}
              </form.AppField>
            ))}
            <form.AppField name="donation_amount">
              {(f) => (
                <f.FormInputField
                  label="Donation Amount"
                  type="number"
                  value={String(f.state.value) ?? "0"}
                  onChange={(v) => f.handleChange(Number(v))}
                  error={f.state.meta.errors[0]}
                />
              )}
            </form.AppField>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="medical" className="rounded-lg border px-4">
          <AccordionTrigger className="gap-2 text-sm font-semibold">
            <Stethoscope className="size-4 text-pink-500" /> Medical Conditions
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                [
                  ["skin_disease", "Skin Disease"],
                  ["diabetes", "Diabetes"],
                  ["hypertension", "Hypertension"],
                  ["thyroidism", "Thyroidism"],
                  ["dyslipidemia", "Dyslipidemia"],
                  ["cancer", "Cancer"],
                  ["asthma", "Asthma"],
                  ["tuberculosis", "Tuberculosis"],
                  ["respiratory_infections", "Respiratory Infections"],
                  [
                    "stress_depression_anxiety",
                    "Stress / Depression / Anxiety",
                  ],
                  ["constipation_diarrhea", "Constipation / Diarrhea"],
                  [
                    "indigestion_acidity_flatulence",
                    "Indigestion / Acidity / Flatulence",
                  ],
                  ["headache", "Headache"],
                  ["heart_related_problems", "Heart Related Problems"],
                  ["kidney_related_problems", "Kidney Related Problems"],
                  ["liver_related_problems", "Liver Related Problems"],
                ] as const
              ).map(([field, label]) => (
                <form.AppField key={field} name={field}>
                  {(f) => (
                    <f.FormSelectField
                      label={label}
                      defaultValue={f.state.value ?? "no"}
                      options={YES_NO_OPTIONS}
                      onChange={(v) => f.handleChange(v as never)}
                      error={f.state.meta.errors[0]}
                    />
                  )}
                </form.AppField>
              ))}
            </div>

            <div className="border-t pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Illness History
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(
                  [
                    ["medical_timelines.last_one_month", "Last 1 Month"],
                    ["medical_timelines.last_three_month", "Last 3 Months"],
                    ["medical_timelines.last_six_month", "Last 6 Months"],
                    ["medical_timelines.last_twelve_month", "Last 12 Months"],
                  ] as const
                ).map(([field, label]) => (
                  <form.AppField key={field} name={field}>
                    {(f) => (
                      <f.FormInputField
                        label={label}
                        placeholder="e.g. Fever, Cold..."
                        value={f.state.value ?? ""}
                        onChange={f.handleChange}
                        error={f.state.meta.errors[0]}
                      />
                    )}
                  </form.AppField>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bank" className="rounded-lg border px-4">
          <AccordionTrigger className="gap-2 text-sm font-semibold">
            <CreditCard className="size-4 text-indigo-500" /> Bank Details
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            {(["bank_name", "account_number", "ifsc", "upi"] as const).map(
              (field) => (
                <form.AppField key={field} name={field}>
                  {(f) => (
                    <f.FormInputField
                      label={field
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                      value={f.state.value}
                      onChange={f.handleChange}
                      error={f.state.meta.errors[0]}
                    />
                  )}
                </form.AppField>
              ),
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </GenericFormContainer>
  );
}
