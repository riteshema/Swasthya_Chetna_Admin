import { z } from "zod";

export const QuerySchema = z.object({
  id: z.number(),

  full_name: z.string(),
  contact_method: z.string(),
  email: z.string().nullable(),
  whatsapp_number: z.string().nullable(),

  inquiry_about: z.string(),

  preferred_time: z.string(),
  time_from: z.string(),
  time_to: z.string(),

  status: z.string(),
  admin_reply: z.string().nullable(),

  replied_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),

  user_id: z.string().uuid().nullable(),
});

export type Query = z.infer<typeof QuerySchema>;

