import z from "zod";

export const Pagination = <T extends z.ZodType>(
  payload: T,
): z.ZodObject<{
  meta: z.ZodObject<{
    current_page: z.ZodNumber;
    next_page: z.ZodNumber;
    previous_page: z.ZodNumber;
    total: z.ZodNumber;
  }>;
  payload: z.ZodArray<T>;
}> =>
  z.object({
    meta: z.object({
      current_page: z.number(),
      next_page: z.number(),
      previous_page: z.number(),
      total: z.int().nonnegative(),
    }),
    payload: z.array(payload),
  });

export type InferPaginationType<T extends z.ZodType> = z.infer<
  ReturnType<typeof Pagination<T>>
>;

export type InferPagination<T extends z.ZodType> = ReturnType<
  typeof Pagination extends { <U extends z.ZodType>(payload: U): infer R }
    ? (payload: T) => R
    : never
>;
