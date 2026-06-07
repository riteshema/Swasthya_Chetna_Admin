import * as z from "zod";
import { Err, Ok, type Result } from "./result";

type QueryInput =
  | string
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export type ColumnFilter = { id: string; value: unknown };
export type ColumnFiltersState = Array<ColumnFilter>;

export type FilterParserOptions = {
  /** Treat empty string "" as undefined when parsing query params. Default: true */
  empty_string_as_undefined?: boolean;

  /** Allow comma-separated arrays in query params (`tags=a,b,c`). Also supports repeated params. Default: true */
  comma_separated_arrays?: boolean;

  /** Path separator for nested objects in query params. Default: "." */
  path_separator?: "." | ":";

  /** Accept bracket syntax (`user[name]=...`). Default: true */
  allow_bracket_syntax?: boolean;

  /** How to encode nested objects in query params. Default: "flatten" */
  complex_encoding?: "flatten" | "json";

  /** How to encode arrays in query params. Default: "repeat" */
  array_encoding?: "repeat" | "comma";

  /** Remove duplicates from arrays (case-insensitive for strings, retains original casing of first instance). Default: false */
  remove_duplicates?: boolean;
};

const DEFAULT_OPTS: Required<FilterParserOptions> = {
  empty_string_as_undefined: true,
  comma_separated_arrays: true,
  path_separator: ".",
  allow_bracket_syntax: true,
  complex_encoding: "flatten",
  array_encoding: "repeat",
  remove_duplicates: false,
};

export interface ParsingError {
  /** Field path (using the configured path_separator, or "root" for top-level errors) */
  field: string;
  /** Human-readable description of what value/type was expected */
  expected_value: string;
  /** Original Zod error message */
  exception: string;
}

/**
 * Minimal shape of `ZodType._def` used by the parser to safely access
 * internal schema metadata without `any`. Zod's internal `_def` is loosely
 * typed, so we read the few fields we care about defensively through this
 * view type.
 */
type ZodDefLike = {
  typeName?: string;
  innerType?: z.ZodType;
  schema?: z.ZodType;
};

/**
 * Minimal shape of `z.ZodIssue` extras used by the parser. `z.ZodIssue` is a
 * discriminated union and several variants carry extra fields that are
 * awkward to narrow without exhaustive switching, so we read them
 * defensively through this view type.
 */
type ZodIssueExtras = {
  options?: readonly unknown[];
  expected?: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
};

/**
 * Schema-driven parser for filter state with full bidirectional conversion:
 * - Query string ↔ Typed object
 * - JSON-like value ↔ Typed object
 * - TanStack Table ColumnFiltersState ↔ Typed object
 *
 * Always returns `Result<T, ParsingError>` (never throws).
 */
export class FilterParser<S extends z.ZodType> {
  public readonly schema: S;
  public readonly opts: Required<FilterParserOptions>;

  constructor(schema: S, options: FilterParserOptions = {}) {
    this.schema = schema;
    this.opts = { ...DEFAULT_OPTS, ...options };
  }

  /** Parse a JSON-like value (or flat query params object) into the typed filter object.
   * Supports both already-nested objects and flat objects with dotted keys
   * (e.g. Next.js `searchParams` with `info.k=...`).
   */
  public parse_json(value: unknown): Result<z.output<S>, ParsingError> {
    let raw: unknown;

    if (typeof value === "string") {
      raw = safe_json_parse(value) ?? value;
    } else if (
      value != null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const keys = Object.keys(value);
      const has_nested_key = keys.some(
        (k) =>
          k.includes(this.opts.path_separator) ||
          (this.opts.allow_bracket_syntax && k.includes("[")),
      );

      if (has_nested_key) {
        const multi = normalize_query_input(value as QueryInput);
        raw = build_object_from_query(multi, this.opts);
      } else {
        raw = value;
      }
    } else {
      raw = value;
    }

    const normalized = normalize_structure_by_schema(
      this.schema,
      raw,
      this.opts,
    );
    return this.validate(normalized);
  }

  /** Parse query params / URL string into the typed filter object. */
  public parse_query(input: QueryInput): Result<z.output<S>, ParsingError> {
    const multi = normalize_query_input(input);
    const raw_object = build_object_from_query(multi, this.opts);
    const normalized = normalize_structure_by_schema(
      this.schema,
      raw_object,
      this.opts,
    );
    return this.validate(normalized);
  }

  /** Validate and return a JSON-ready typed output. */
  public to_json(value: unknown): Result<z.output<S>, ParsingError> {
    const normalized = normalize_structure_by_schema(
      this.schema,
      value,
      this.opts,
    );
    return this.validate(normalized);
  }

  /** Validate and serialize to query string. */
  public to_query(value: unknown): Result<string, ParsingError> {
    const normalized = normalize_structure_by_schema(
      this.schema,
      value,
      this.opts,
    );
    return this.validate(normalized).and_then((parsed) => {
      const params = new URLSearchParams();
      for (const [k, v] of flatten_for_query(parsed, this.opts)) {
        params.append(k, v);
      }
      return Ok(params.toString());
    });
  }

  /** Validate and convert to TanStack Table `ColumnFiltersState`. */
  public to_column_filters_state(
    value: unknown,
  ): Result<ColumnFiltersState, ParsingError> {
    const normalized = normalize_structure_by_schema(
      this.schema,
      value,
      this.opts,
    );
    return this.validate(normalized).and_then((parsed) =>
      Ok(flatten_to_column_filters_state(parsed, this.opts)),
    );
  }

  /** Convert TanStack Table `ColumnFiltersState` back to typed filter object. */
  public from_column_filters_state(
    state: ColumnFiltersState,
  ): Result<z.output<S>, ParsingError> {
    const raw_object = build_object_from_column_filters_state(state, this.opts);
    const normalized = normalize_structure_by_schema(
      this.schema,
      raw_object,
      this.opts,
    );
    return this.validate(normalized);
  }

  private validate(input: unknown): Result<z.output<S>, ParsingError> {
    try {
      return Ok(this.schema.parse(input));
    } catch (e) {
      if (e instanceof z.ZodError) {
        return Err(this.zod_error_to_parsing_error(e));
      }
      return Err({
        field: "root",
        expected_value: "valid data according to schema",
        exception: e instanceof Error ? e.message : String(e),
      });
    }
  }

  private zod_error_to_parsing_error(error: z.ZodError): ParsingError {
    const issue = error.issues[0];
    const issue_extras = issue as unknown as ZodIssueExtras;

    const field =
      issue.path.length > 0
        ? issue.path.map((p) => String(p)).join(this.opts.path_separator)
        : "root";

    let expected_value = issue.message;

    if (issue.code === "invalid_value") {
      const options = issue_extras.options ?? [];
      expected_value =
        options.length > 0
          ? `one of: [${options.map((o) => String(o)).join(", ")}]`
          : issue.message;
    } else if (issue.code === "invalid_type") {
      expected_value = `${issue_extras.expected ?? "valid type"}`;
    } else if (issue.code === "too_small") {
      expected_value = `minimum: ${String(issue_extras.minimum)}`;
    } else if (issue.code === "too_big") {
      expected_value = `maximum: ${String(issue_extras.maximum)}`;
    }

    return {
      field,
      expected_value,
      exception: issue.message,
    };
  }
}

function normalize_query_input(input: QueryInput): Map<string, string[]> {
  const map = new Map<string, string[]>();

  const add = (k: string, v: string): void => {
    const arr = map.get(k);
    if (arr) {
      arr.push(v);
    } else {
      map.set(k, [v]);
    }
  };

  if (typeof input === "string") {
    const s = input.startsWith("?") ? input.slice(1) : input;
    const sp = new URLSearchParams(s);
    sp.forEach((v, k) => {
      add(k, v);
    });
    return map;
  }

  if (input instanceof URLSearchParams) {
    input.forEach((v, k) => {
      add(k, v);
    });
    return map;
  }

  for (const [k, v] of Object.entries(input)) {
    if (v == null) {
      continue;
    }
    if (Array.isArray(v)) {
      for (const vv of v) {
        add(k, String(vv));
      }
    } else {
      add(k, String(v));
    }
  }

  return map;
}

function build_object_from_query(
  multi: Map<string, string[]>,
  opts: Required<FilterParserOptions>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [raw_key, values] of multi.entries()) {
    const key = raw_key.endsWith("[]") ? raw_key.slice(0, -2) : raw_key;
    const path = parse_key_path(key, opts);

    let value: unknown = values.length > 1 ? values : values[0];

    if (opts.empty_string_as_undefined) {
      if (typeof value === "string" && value === "") {
        value = undefined;
      }
      if (Array.isArray(value)) {
        value = value.map((s: unknown) => (s === "" ? undefined : s));
      }
    }

    set_deep(out, path, value);
  }

  return out;
}

function parse_key_path(
  key: string,
  opts: Required<FilterParserOptions>,
): string[] {
  if (opts.allow_bracket_syntax && key.includes("[")) {
    const parts: string[] = [];
    const first_bracket = key.indexOf("[");
    parts.push(key.slice(0, first_bracket));
    const rest = key.slice(first_bracket);
    const re = /\[([^\]]+)\]/g;
    let m: RegExpExecArray | null = re.exec(rest);
    while (m !== null) {
      parts.push(m[1]);
      m = re.exec(rest);
    }
    return parts.filter(Boolean);
  }

  return key.split(opts.path_separator).filter(Boolean);
}

function set_deep(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  let cur: Record<string, unknown> = obj;

  for (let i = 0; i < path.length; i++) {
    const k = path[i];
    const is_last = i === path.length - 1;

    if (is_last) {
      const existing = cur[k];

      if (existing === undefined) {
        cur[k] = value;
      } else if (Array.isArray(existing)) {
        const existing_arr = existing as unknown[];
        cur[k] = Array.isArray(value)
          ? [...existing_arr, ...(value as unknown[])]
          : [...existing_arr, value];
      } else {
        cur[k] = Array.isArray(value)
          ? [existing, ...(value as unknown[])]
          : [existing, value];
      }
      return;
    }

    const next = cur[k];
    if (next == null || typeof next !== "object" || Array.isArray(next)) {
      cur[k] = {};
    }
    cur = cur[k] as Record<string, unknown>;
  }
}

function normalize_structure_by_schema(
  schema: z.ZodType,
  value: unknown,
  opts: Required<FilterParserOptions>,
): unknown {
  if (value === undefined) {
    return undefined;
  }

  const def = schema._def as ZodDefLike;

  // Unwrap utilities safely step through modifiers
  if (schema instanceof z.ZodOptional) {
    return normalize_structure_by_schema(
      schema.unwrap() as z.ZodType,
      value,
      opts,
    );
  }
  if (schema instanceof z.ZodNullable) {
    if (value === null || value === "null") {
      return null;
    }
    return normalize_structure_by_schema(
      schema.unwrap() as z.ZodType,
      value,
      opts,
    );
  }
  if (schema instanceof z.ZodDefault || def.typeName === "ZodDefault") {
    // Avoid deprecated removeDefault() by unwrapping manually
    if (def.innerType) {
      return normalize_structure_by_schema(def.innerType, value, opts);
    }
  }
  if (def.typeName === "ZodEffects") {
    // Avoids missing ZodEffects class export, Effects schema is stored under .schema
    if (def.schema) {
      return normalize_structure_by_schema(def.schema, value, opts);
    }
  }

  if (schema instanceof z.ZodArray) {
    if (value === undefined) {
      return undefined;
    }

    let arr: unknown[];
    if (Array.isArray(value)) {
      arr = value;
    } else if (
      is_plain_object(value) &&
      Object.keys(value).length > 0 &&
      Object.keys(value as object).every((k) => /^\d+$/.test(k))
    ) {
      // Reconstruct array from indexed keys produced by flattenForQuery
      // e.g. { "0": { date: ... }, "1": { date: ... } } → [{ date: ... }, ...]
      const indices = Object.keys(value as object).map(Number);
      const max_idx = Math.max(...indices);
      arr = [];
      for (let i = 0; i <= max_idx; i++) {
        arr.push(value[String(i)]);
      }
    } else if (typeof value === "string") {
      if (opts.comma_separated_arrays && value.includes(",")) {
        arr = value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => !(opts.empty_string_as_undefined && s === ""));
      } else {
        arr = [value];
      }
    } else {
      arr = [value];
    }

    const inner = schema.element as z.ZodType;
    let mapped = arr.map((v) =>
      normalize_structure_by_schema(inner, maybe_json(v), opts),
    );

    // Handle generic deduplication
    if (opts.remove_duplicates) {
      const seen = new Set<string>();
      mapped = mapped.filter((item) => {
        const key = get_dedupe_key(item);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    return mapped;
  }

  if (schema instanceof z.ZodObject) {
    const obj =
      typeof value === "string" ? (safe_json_parse(value) ?? value) : value;

    if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
      return obj;
    }

    const obj_record = obj as Record<string, unknown>;
    const shape = schema.shape as Record<string, z.ZodType>;
    const out: Record<string, unknown> = {};

    for (const key of Object.keys(shape)) {
      out[key] = normalize_structure_by_schema(
        shape[key],
        obj_record[key],
        opts,
      );
    }

    for (const k of Object.keys(obj_record)) {
      if (!(k in out)) {
        out[k] = obj_record[k];
      }
    }

    return out;
  }

  if (schema instanceof z.ZodUnion) {
    for (const opt of schema.options as Array<z.ZodType>) {
      const candidate = normalize_structure_by_schema(opt, value, opts);
      if (opt.safeParse(candidate).success) {
        return candidate;
      }
    }
    return value;
  }

  if (schema instanceof z.ZodTuple) {
    const v =
      typeof value === "string" ? (safe_json_parse(value) ?? value) : value;
    return v;
  }

  if (schema instanceof z.ZodString) {
    if (value === undefined || value === null) {
      return value;
    }
    return typeof value === "string" ? value : String(value);
  }

  return maybe_json(value);
}

function maybe_json(v: unknown): unknown {
  if (typeof v !== "string") {
    return v;
  }
  return safe_json_parse(v) ?? v;
}

function safe_json_parse(s: string): unknown {
  const t = s.trim();
  if (!t) {
    return undefined;
  }

  const looks_json =
    t.startsWith("{") ||
    t.startsWith("[") ||
    t === "null" ||
    t === "true" ||
    t === "false" ||
    t.startsWith('"') ||
    /^-?\d+(\.\d+)?$/.test(t);

  if (!looks_json) {
    return undefined;
  }

  try {
    return JSON.parse(t) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Creates a unique case-insensitive hash-key representing an object's values.
 * Strings are lowercased and object keys are sorted to ensure stability.
 */
function get_dedupe_key(obj: unknown): string {
  if (typeof obj === "string") {
    return `str:${obj.toLowerCase()}`;
  }
  if (
    typeof obj === "number" ||
    typeof obj === "boolean" ||
    typeof obj === "bigint"
  ) {
    return `${typeof obj}:${String(obj)}`;
  }
  if (obj === null || obj === undefined) {
    return String(obj);
  }
  if (obj instanceof Date) {
    return `date:${obj.getTime()}`;
  }

  if (Array.isArray(obj)) {
    return `[${obj.map(get_dedupe_key).join(",")}]`;
  }

  if (typeof obj === "object") {
    const obj_record = obj as Record<string, unknown>;
    const keys = Object.keys(obj_record).sort();
    let str = "{";
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      // lower case nested string keys for complete case-insensitivity matches
      str += `${JSON.stringify(k.toLowerCase())}:${get_dedupe_key(obj_record[k])}`;
      if (i < keys.length - 1) {
        str += ",";
      }
    }
    str += "}";
    return str;
  }

  return String(obj);
}

function flatten_for_query(
  value: unknown,
  opts: Required<FilterParserOptions>,
): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];

  const scalar_to_string = (v: unknown): string => {
    if (v === null) {
      return "null";
    }
    if (v instanceof Date) {
      return v.toISOString();
    }
    if (typeof v === "bigint") {
      return v.toString();
    }
    if (typeof v === "boolean") {
      return v ? "true" : "false";
    }
    if (typeof v === "number") {
      return String(v);
    }
    if (typeof v === "string") {
      return v;
    }
    return JSON.stringify(v);
  };

  const add_scalar = (k: string, v: unknown): void => {
    if (v === undefined) {
      return;
    }
    pairs.push([k, scalar_to_string(v)]);
  };

  const walk = (cur: unknown, prefix: string | null): void => {
    if (cur === undefined) {
      return;
    }

    if (Array.isArray(cur)) {
      if (!prefix) {
        return;
      }

      const has_complex = cur.some(
        (x) => Array.isArray(x) || is_plain_object(x),
      );

      if (has_complex) {
        cur.forEach((item, i) => {
          walk(item, `${prefix}${opts.path_separator}${i}`);
        });
        return;
      }

      if (opts.array_encoding === "comma") {
        pairs.push([prefix, cur.map(scalar_to_string).join(",")]);
        return;
      }

      // repeat (default)
      for (const item of cur) {
        add_scalar(prefix, item);
      }
      return;
    }

    if (cur instanceof Date || cur === null || typeof cur !== "object") {
      if (prefix) {
        add_scalar(prefix, cur);
      }
      return;
    }

    for (const [k, v] of Object.entries(cur as Record<string, unknown>)) {
      const next_key = prefix ? `${prefix}${opts.path_separator}${k}` : k;

      if (is_plain_object(v)) {
        if (opts.complex_encoding === "json") {
          pairs.push([next_key, JSON.stringify(v)]);
        } else {
          walk(v, next_key);
        }
      } else {
        walk(v, next_key);
      }
    }
  };

  walk(value, null);
  return pairs;
}

function normalize_filter_value_for_state(v: unknown): unknown {
  if (v instanceof Date) {
    return v.toISOString();
  }
  if (typeof v === "bigint") {
    return v.toString();
  }
  return v;
}

function flatten_to_column_filters_state(
  value: unknown,
  opts: Required<FilterParserOptions>,
): ColumnFiltersState {
  const out: ColumnFiltersState = [];

  const walk = (cur: unknown, prefix: string | null): void => {
    if (cur === undefined) {
      return;
    }

    if (
      typeof cur === "string" &&
      opts.empty_string_as_undefined &&
      cur === ""
    ) {
      return;
    }

    if (Array.isArray(cur) && cur.length === 0) {
      return;
    }

    if (Array.isArray(cur)) {
      if (!prefix) {
        return;
      }
      out.push({
        id: prefix,
        value: cur.map(normalize_filter_value_for_state),
      });
      return;
    }

    if (!is_plain_object(cur)) {
      if (!prefix) {
        return;
      }
      out.push({ id: prefix, value: normalize_filter_value_for_state(cur) });
      return;
    }

    for (const [k, v] of Object.entries(cur)) {
      const next_key = prefix ? `${prefix}${opts.path_separator}${k}` : k;
      walk(v, next_key);
    }
  };

  walk(value, null);
  return out;
}

function build_object_from_column_filters_state(
  state: ColumnFiltersState,
  opts: Required<FilterParserOptions>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const f of state) {
    const path = f.id.split(opts.path_separator).filter(Boolean);
    set_deep(out, path, f.value);
  }

  return out;
}

function is_plain_object(x: unknown): x is Record<string, unknown> {
  return (
    x != null &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    !(x instanceof Date)
  );
}
