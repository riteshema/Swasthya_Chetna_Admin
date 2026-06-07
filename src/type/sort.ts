
import * as z from "zod";

export const SortSchema =z.object({
  sort:z.record(
  z.string(),
  z.enum(["asc", "desc"])
)
}) ;

