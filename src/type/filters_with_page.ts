import { type InferZodType } from "@lib/infer_zod_schema";
import type z from "zod";
import { type DeepPartial } from "./deep_partial";

export type FiltersWithPage<T extends z.ZodType> = InferZodType<
  DeepPartial<T>
> & {
  page?: number;
  limit?: number;
};
