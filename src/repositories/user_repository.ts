import { type SupabaseClient } from "@supabase/supabase-js";
import Supabase from "@lib/supabase";
import { Err, Ok, type Result } from "@lib/result";
import { UserAdminSchema } from "@dto/user_type";
import { Pagination, type InferPaginationType } from "@lib/pagination";
import { type DeepPartial } from "@type/deep_partial";
import { InferZodType } from "@lib/infer_zod_schema";

export default class UserRepository {
  private client: SupabaseClient;

  private constructor(client: SupabaseClient) {
    this.client = client;
  }

  public static async for_server(): Promise<UserRepository> {
    const client = await Supabase.get_server_instance();
    return new UserRepository(client);
  }

  public static for_client(): UserRepository {
    const client = Supabase.get_client_instance();
    return new UserRepository(client);
  }

  public async get_all_users(args: {
    page_limit: number;
    current_page: number;
    filters: InferZodType<DeepPartial<typeof UserAdminSchema>>;
  }): Promise<Result<InferPaginationType<typeof UserAdminSchema>, string>> {
    const { data, error } = await this.client.rpc("admin_get_all_users", {
      p_page_limit: args.page_limit ?? 10,
      p_current_page: args.current_page ?? 0,
      p_filters: args.filters ?? null,
    });

    if (error) {
      return Err(error.message);
    }

    const parsed_data = Pagination(UserAdminSchema).safeParse(data);

    if (!parsed_data.success) {
      return Err(parsed_data.error.issues.map((e) => e.message).join(","));
    }

    return Ok(parsed_data.data);
  }

  public async get_user_by_id(
    user_id: string,
  ): Promise<Result<InferPaginationType<typeof UserAdminSchema>, string>> {
    const { data, error } = await this.client.rpc("admin_get_all_users", {
      p_page_limit: 1,
      p_current_page: 0,
      p_filters: { user_id },
    });

    if (error) {
      return Err(error.message);
    }

    const parsed_list = Pagination(UserAdminSchema).safeParse(data);

    if (!parsed_list.success) {
      return Err(parsed_list.error.issues.map((e) => e.message).join(","));
    }

    const user = parsed_list.data;

    if (!user) {
      return Err("User not found");
    }

    return Ok(user);
  }

  public async update_role_request(args: {
    user_id: string;
    status: "pending" | "approved" | "rejected";
    admin_note?: string;
  }): Promise<Result<null, string>> {
    const { error } = await this.client.rpc("admin_update_role_request", {
      p_update: {
        user_id: args.user_id,
        status: args.status,
        admin_note: args.admin_note ?? null,
      },
    });

    if (error) {
      return Err(error.message);
    }

    return Ok(null);
  }

  public async update_user_role(args: {
    user_id: string;
    role: string;
    is_active: boolean;
  }): Promise<Result<null, string>> {
    const { error } = await this.client.rpc("admin_update_user_role", {
      p_update: {
        user_id: args.user_id,
        role: args.role,
        is_active: args.is_active,
      },
    });

    if (error) {
      return Err(error.message);
    }

    return Ok(null);
  }

  public async update_user(
    args: InferZodType<typeof UserAdminSchema>,
  ): Promise<Result<InferZodType<typeof UserAdminSchema>, string>> {
    const { data, error } = await this.client.rpc("admin_update_user", {
      p_data: args,
    });

    if (error) return Err(error.message);

    const parsed = UserAdminSchema.safeParse(data);
    if (!parsed.success) {
      return Err(parsed.error.issues.map((e) => e.message).join(","));
    }

    return Ok(parsed.data);
  }
}
