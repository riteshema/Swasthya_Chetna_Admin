import PaymentTable from "@components/tables/payment_table";
import { build_deep_partial_schema } from "@lib/build_partial_schema";
import { FilterParser } from "@lib/filter";
import { PaymentSchema } from "@dto/payment_type";
import { type JSX } from "react";
import z from "zod";

interface PaymentProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const PaymentFilterSchema = PaymentSchema.omit({
  approve: true,
  payment_amount: true,
}).extend({
  approve: z.string().optional(),
  payment_amount: z.string().optional(),
});

export default async function PaymentPage({
  searchParams,
}: Readonly<PaymentProps>): Promise<JSX.Element> {
  const params = (await searchParams) ?? {};

  const parser = new FilterParser(
    build_deep_partial_schema(PaymentFilterSchema).extend({
      page: z.coerce.number().positive().optional().default(1),
      limit: z.coerce.number().positive().optional().default(10),
    }),
    { array_encoding: "comma" },
  );

  const t = parser.parse_json(params);
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Review and manage all payment submissions
        </p>
      </div>
      <PaymentTable filters={t.is_ok() ? t.value : null} />
    </div>
  );
}