import { type Dialog } from "@components/ui/dialog";
import {
  type InferZodType,
  type InferZodTypeOrUndefined,
} from "@lib/infer_zod_schema";
import { type RowAction, type RowActionSubmitFn } from "@lib/row_action";
import { type ComponentPropsWithRef } from "react";
import type z from "zod";

export default interface FormProps<
  T extends z.ZodType,
  U extends z.ZodType | undefined = undefined,
> extends ComponentPropsWithRef<typeof Dialog> {
  rowAction: RowAction<InferZodType<T>, InferZodTypeOrUndefined<U>> | null;
  onSubmit: RowActionSubmitFn<InferZodType<T>, InferZodTypeOrUndefined<U>>;
}
