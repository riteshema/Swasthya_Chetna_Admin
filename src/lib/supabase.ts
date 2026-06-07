import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";

export default class Supabase {
  private static supabase_project_url: string =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NO_PROJECT_URL";

  private static supabase_anon_key: string =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "NO_ANON_KEY";

  private constructor() {}

  public static async get_server_instance(): Promise<SupabaseClient> {
    const { cookies } = await import("next/headers");
    const { headers } = await import("next/headers");

    const cookie_store = await cookies();
    const header_store = await headers();

    return createServerClient(
      this.supabase_project_url,
      this.supabase_anon_key,
      {
        cookieOptions: {
          domain: Supabase.get_cookie_domain(header_store.get("host") ?? null),
        },
        cookies: {
          getAll() {
            return cookie_store.getAll();
          },
          setAll(provided_cookies) {
            try {
              provided_cookies.forEach(({ name, value, options }) =>
                cookie_store.set(name, value, options),
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    );
  }

  public static get_client_instance(): SupabaseClient {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : null;

    return createBrowserClient(
      this.supabase_project_url,
      this.supabase_anon_key,
      {
        cookieOptions: {
          domain: Supabase.get_cookie_domain(hostname),
        },
        isSingleton: true,
      },
    ) as SupabaseClient;
  }

  private static get_cookie_domain(
    hostname: string | null,
  ): string | undefined {
    if (process.env.NODE_ENV !== "production" || !hostname) {
      return undefined;
    }

    const host = hostname.split(":")[0].toLowerCase().trim();

    if (!host || host.includes("localhost") || host === "127.0.0.1") {
      return undefined;
    }

    const parts = host.split(".");

    if (parts.length < 2) {
      return `.${host}`;
    }

    const base_domain = parts.slice(-2).join(".");

    return `.${base_domain}`;
  }
}
