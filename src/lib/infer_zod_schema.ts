import type z from "zod";

export type InferZodType<T extends z.ZodType> = z.infer<T>;

export type InferZodTypeOrUndefined<T> = [T] extends [undefined]
  ? undefined
  : z.infer<Exclude<T, undefined>>;
