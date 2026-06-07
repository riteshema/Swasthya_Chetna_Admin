import { Ok, type Result } from "@lib/result";
import { type SortingState } from "@tanstack/react-table";
import { type InferZodType } from "./infer_zod_schema";
import { type SortSchema } from "@type/index";

type SortRecord = InferZodType<typeof SortSchema>["sort"];

export default class SortingParser {
  public from_sorting_state(
    sorting: SortingState,
  ): Result<SortRecord, never> {
    const result: SortRecord = {};

    for (const item of sorting) {
      result[item.id] = item.desc ? "desc" : "asc";
    }

    return Ok(result);
  }

  public to_sorting_state(
    sort_obj: SortRecord,
  ): Result<SortingState, never> {
    const result: SortingState = [];

    for (const [key, value] of Object.entries(sort_obj)) {
      result.push({
        id: key,
        desc: value === "desc",
      });
    }

    return Ok(result);
  }
}