  import { type SupabaseClient } from "@supabase/supabase-js";
  import Supabase from "@lib/supabase";
  import { Err, Ok, type Result } from "@lib/result";
  import { QuerySchema } from "@dto/query_type";
  import { Pagination, type InferPaginationType } from "@lib/pagination";
  import { type DeepPartial } from "@type/deep_partial";
  import { type InferZodType } from "@lib/infer_zod_schema";

  export class QueryClientRepository {
    private client: SupabaseClient;

    private constructor(client: SupabaseClient) {
      this.client = client;
    }

    public static for_client(): QueryClientRepository {
      const client = Supabase.get_client_instance();
      return new QueryClientRepository(client);
    }

    public async get_all_queries(args: {
      page_limit: number;
      current_page: number;
      filters: InferZodType<DeepPartial<typeof QuerySchema>>;
    }): Promise<Result<InferPaginationType<typeof QuerySchema>, string>> {
      const { data, error } = await this.client.rpc(
        "admin_get_all_course_query",
        {
          p_page_limit: args.page_limit ?? 10,
          p_current_page: args.current_page ?? 0,
          p_filters: args.filters ?? {},
        },
  
      );

      if (error) return Err(error.message);

    const parsed_data = Pagination(QuerySchema).safeParse(data);
      if (!parsed_data.success) {
        return Err(parsed_data.error.issues.map((e) => e.message).join(","));
      }

      return Ok(parsed_data.data);
    }
  }