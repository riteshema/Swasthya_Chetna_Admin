import { type SupabaseClient } from "@supabase/supabase-js";
import Supabase from "@lib/supabase";
import { Err, Ok, type Result } from "@lib/result";
import { PaymentSchema } from "@dto/payment_type";
import { Pagination, type InferPaginationType } from "@lib/pagination";
import { type DeepPartial } from "@type/deep_partial";
import { type InferZodType } from "@lib/infer_zod_schema";
export default class PaymentRepository {
  private client: SupabaseClient;
  private constructor(client: SupabaseClient) {
    this.client = client;
  }
  public static async for_server(): Promise<PaymentRepository> {
    const client = await Supabase.get_server_instance();
    return new PaymentRepository(client);
  }
  public static for_client(): PaymentRepository {
    const client = Supabase.get_client_instance();
    return new PaymentRepository(client);
  }
  public async get_all_payments(args: {
    page_limit: number;
    current_page: number;
    filters: InferZodType<DeepPartial<typeof PaymentSchema>>;
  }): Promise<Result<InferPaginationType<typeof PaymentSchema>, string>> {
    const { data, error } = await this.client.rpc("admin_get_all_payments_proof", {
      p_page_limit: args.page_limit ?? 10,
      p_current_page: args.current_page ?? 0,
      p_filters: args.filters ?? null,
    });
    if (error) return Err(error.message);
    const parsed_data = Pagination(PaymentSchema).safeParse(data);
    if (!parsed_data.success) {
      return Err(parsed_data.error.issues.map((e) => e.message).join(","));
    }
    return Ok(parsed_data.data);
  }
  public async update_payment(
    args: InferZodType<typeof PaymentSchema>,
  ): Promise<Result<InferZodType<typeof PaymentSchema>, string>> {
    const { data, error } = await this.client.rpc("update_payment_proof", {
      p_data: args,
    });
    if (error) return Err(error.message);
    const parsed = PaymentSchema.safeParse(data);
    if (!parsed.success) {
      return Err(parsed.error.issues.map((e) => e.message).join(","));
    }
    return Ok(parsed.data);
  }
  public async delete_payment(id: number): Promise<Result<void, string>> {
    const { error } = await this.client.rpc("delete_payment_proof", {
      p_data: { id },
    });
    if (error) return Err(error.message);
    return Ok(undefined);
  }
}