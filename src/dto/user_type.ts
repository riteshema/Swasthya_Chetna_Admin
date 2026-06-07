import { z } from "zod";

const MedicalTimelineSchema = z.object({
  timeline: z.enum([
    "last_one_month",
    "last_three_month",
    "last_six_month",
    "last_twelve_month",
  ]),
  has_illness: z.enum(["yes", "no"]),
  details: z.string().nullable(),
});

const YesNoSchema = z.enum(["yes", "no"]);
const YesNoNullSchema = YesNoSchema.nullable();


export const UserAdminSchema = z.object({
  user_id: z.uuid(),
  email: z.email("Invalid email"),
  registered_at: z.coerce.date(),
  status: z.string().optional(),

  first_name:            z.string().nullable(),
  middle_name:           z.string().nullable(),
  last_name:             z.string().nullable(),
  dob:                   z.coerce.date().nullable(),
  age:                   z.number().int().min(0).max(150).nullable(),
  gender:                z.string().nullable(),
  marital_status:        z.string().nullable(),
  education:             z.string().nullable(),
  occupation:            z.string().nullable(),
  designation:           z.string().nullable(),
  organization_email:    z.string().nullable(),
  organization_contact:  z.string().nullable(),
  voter_id:              z.string().nullable(),
  aadhar_card:           z.number().nullable(),
  avatar_url:            z.string().nullable(),

  country:       z.string().nullable(),
  state:         z.string().nullable(),
  district:      z.string().nullable(),
  area:          z.string().nullable(),
  pincode:       z.string().nullable(),
  landmark:      z.string().nullable(),
  society:       z.string().nullable(),
  house_number:  z.string().nullable(),
  street_number: z.string().nullable(),

  role:           z.string().nullable(),
  role_is_active: z.boolean().nullable(),

  requested_role:       z.string().nullable(),
  role_request_status:  z.enum(["pending", "approved", "rejected"]).nullable(),
  role_request_note:    z.string().nullable(),

  insurance_occupation:    z.string().nullable(),
  annual_income:           z.preprocess((v) => v ?? null, z.number().nullable()),
  medical_insurance:       z.enum(["Yes", "No"]).nullable(),
  health_insurance_company: z.string().nullable(),
  sum_insure:              z.preprocess((v) => v ?? null, z.number().nullable()),
  policy_name:             z.string().nullable(),
  policy_start_date:       z.coerce.date().nullable(),
  policy_end_date:         z.coerce.date().nullable(),
  premium_amount:          z.preprocess((v) => v ?? null, z.number().nullable()),

  habit_exercise:  z.string().nullable(),
  food:            z.string().nullable(),
  drinks:          z.string().nullable(),
  intoxications:   z.string().nullable(),
  hobbies:         z.string().nullable(),
  likings:         z.string().nullable(),
  disliking:       z.string().nullable(),
  life_goal:       z.string().max(1800).nullable(),

  running:                        YesNoNullSchema,
  walking:                        YesNoNullSchema,
  cycling:                        YesNoNullSchema,
  fitness_exercise:               YesNoNullSchema,
  competitive_sports_events:      YesNoNullSchema,
  paid_events:                    YesNoNullSchema,
  regular_health_management:      YesNoNullSchema,
  donate_for_society_benefit:     YesNoNullSchema,
  invest_funds_in_company_shares: YesNoNullSchema,
  donation_amount:                z.preprocess((v) => v ?? null, z.number().nullable()),

  skin_disease:                   YesNoNullSchema,
  diabetes:                       YesNoNullSchema,
  hypertension:                   YesNoNullSchema,
  thyroidism:                     YesNoNullSchema,
  dyslipidemia:                   YesNoNullSchema,
  cancer:                         YesNoNullSchema,
  asthma:                         YesNoNullSchema,
  tuberculosis:                   YesNoNullSchema,
  respiratory_infections:         YesNoNullSchema,
  stress_depression_anxiety:      YesNoNullSchema,
  constipation_diarrhea:          YesNoNullSchema,
  indigestion_acidity_flatulence: YesNoNullSchema,
  headache:                       YesNoNullSchema,
  heart_related_problems:         YesNoNullSchema,
  kidney_related_problems:        YesNoNullSchema,
  liver_related_problems:         YesNoNullSchema,

  medical_timelines: z.array(MedicalTimelineSchema).default([]),

  bank_name:      z.string().nullable(),
  account_number: z.string().nullable(),
  ifsc:           z.string().nullable(),
  upi:            z.string().nullable(),

  has_personal_info:    z.boolean(),
  has_address:          z.boolean(),
  has_health_insurance: z.boolean(),
  has_personal_habits:  z.boolean(),
  has_medical_condition: z.boolean(),
  has_health_fitness:   z.boolean(),
  has_bank_details:     z.boolean(),
});


export type UserAdmin         = z.infer<typeof UserAdminSchema>;
export type MedicalTimeline   = z.infer<typeof MedicalTimelineSchema>;