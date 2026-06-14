import { z } from "zod";

export const PaymentSchema = z.object({
  id: z.coerce.number(),
  created_at: z.string().optional(),
  transaction_id: z.string(),
  user_id: z.uuid(),
  payment_method: z.string(),
  payment_amount: z.coerce.number(),
  payment_reason: z.string(),
  approve: z.boolean(),
  full_name: z.string(),
});

export type Payment = z.infer<typeof PaymentSchema>;