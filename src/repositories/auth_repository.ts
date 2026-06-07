import { Err, Ok, type Result } from "@lib/result";
import Supabase from "@lib/supabase";
import { type User, type SupabaseClient } from "@supabase/supabase-js";

export default class AuthRepository {
  private client: SupabaseClient;

  private constructor(client: SupabaseClient) {
    this.client = client;
  }

  public static async for_server(): Promise<AuthRepository> {
    const client = await Supabase.get_server_instance();
    return new AuthRepository(client);
  }
  public static for_client(): AuthRepository {
    const client = Supabase.get_client_instance();
    return new AuthRepository(client);
  }

  public async authenticate(args: {
    email: string;
    password: string;
  }): Promise<Result<User, string>> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: args.email,
      password: args.password,
    });
    if (error) {
      return Err(error.message);
    }
    if (!data.user) {
      return Err("User not found");
    }

    return Ok(data.user);
  }

  public async get_user(): Promise<Result<User, string>> {
    const { data, error } = await this.client.auth.getUser();
    if (error) {
      return Err(error.message);
    }
    if (!data.user) {
      return Err("Unauthorized User");
    }
    return Ok(data.user);
  }
}
