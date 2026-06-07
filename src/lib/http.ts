import { Err, Ok, type Result } from "./result";
import axios, { type AxiosInstance, isAxiosError } from "axios";
import type { InferZodType } from "./infer_zod_schema";
import type { ZodType, ZodError } from "zod";

type HttpError<E> =
  | { kind: "connection_error"; message: string }
  | { kind: "timeout_error"; message: string }
  | { kind: "network_error"; message: string }
  | {
      kind: "unexpected_status";
      expected: number;
      actual: number;
      data: unknown;
    }
  | { kind: "response_validation_error"; issues: ZodError; raw: unknown }
  | { kind: "server_error"; status: number; data: E }
  | {
      kind: "server_error_unparsed";
      status: number;
      raw: unknown;
      issues: ZodError;
    }
  | { kind: "unknown_error"; message: string };

type RequestOptions = {
  request_timeout?: number;
  expected_status_code?: number;
  headers?: Record<string, string>;
};

export type { HttpError, RequestOptions };

export default class Http<E extends ZodType> {
  private http_client: AxiosInstance;

  private error_schema: E;

  private static readonly default_timeout = 1000 * 10;

  constructor(args: { base_url: string; error_schema: E; cookies?: string }) {
    this.error_schema = args.error_schema;
    this.http_client = axios.create({
      baseURL: args.base_url,
      withCredentials: true,
      headers:
        args.cookies !== undefined ? { cookie: args.cookies } : undefined,
    });
  }

  public async get<S extends ZodType>(args: {
    route: string;
    schema: S;
    options?: RequestOptions;
  }): Promise<Result<InferZodType<S>, HttpError<InferZodType<E>>>> {
    return this.request({ method: "get", ...args });
  }

  public async post<S extends ZodType>(args: {
    route: string;
    schema: S;
    body?: unknown;
    options?: RequestOptions;
  }): Promise<Result<InferZodType<S>, HttpError<InferZodType<E>>>> {
    return this.request({ method: "post", ...args });
  }

  private async request<S extends ZodType>(args: {
    method: "get" | "post";
    route: string;
    schema: S;
    body?: unknown;
    options?: RequestOptions;
  }): Promise<Result<InferZodType<S>, HttpError<InferZodType<E>>>> {
    const timeout = args.options?.request_timeout ?? Http.default_timeout;
    const expected_status = args.options?.expected_status_code ?? 200;
    const headers = args.options?.headers;

    try {
      const response =
        args.method === "get"
          ? await this.http_client.get<unknown>(args.route, {
              timeout,
              headers,
            })
          : await this.http_client.post<unknown>(args.route, args.body, {
              timeout,
              headers,
              maxBodyLength: Infinity,
            });

      if (response.status !== expected_status) {
        return Err({
          kind: "unexpected_status",
          expected: expected_status,
          actual: response.status,
          data: response.data,
        });
      }

      const parsed = await args.schema.safeParseAsync(response.data);
      if (!parsed.success) {
        return Err({
          kind: "response_validation_error",
          issues: parsed.error,
          raw: response.data,
        });
      }
      return Ok(parsed.data);
    } catch (error) {
      return Err(await this.handle_error(error));
    }
  }

  private async handle_error(
    error: unknown,
  ): Promise<HttpError<InferZodType<E>>> {
    if (isAxiosError(error)) {
      if (error.code === "ECONNREFUSED") {
        return {
          kind: "connection_error",
          message: "Cannot connect to the service.",
        };
      }
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return { kind: "timeout_error", message: error.message };
      }

      if (error.response !== undefined) {
        let raw: unknown = error.response.data;

        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw) as unknown;
          } catch {
            // Not JSON
          }
        }

        const parsed = await this.error_schema.safeParseAsync(raw);
        if (parsed.success) {
          return {
            kind: "server_error",
            status: error.response.status,
            data: parsed.data,
          };
        }
        return {
          kind: "server_error_unparsed",
          status: error.response.status,
          raw,
          issues: parsed.error,
        };
      }

      return { kind: "network_error", message: error.message };
    }

    if (error instanceof Error) {
      return { kind: "unknown_error", message: error.message };
    }

    return { kind: "unknown_error", message: "An unknown error occurred." };
  }
}
