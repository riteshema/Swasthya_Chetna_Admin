import {
  type SortingState,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Updater,
  type RowSelectionState,
} from "@tanstack/react-table";
import type z from "zod";
import { type MaybePromise } from "../../definitions";
import { type ReactNode } from "react";
import {
  type InferZodType,
  type InferZodTypeOrUndefined,
} from "@lib/infer_zod_schema";
import { type InferPaginationType } from "@lib/pagination";
import { type Result } from "@lib/result";

export interface TableMutationFunctions<
  T extends z.ZodType,
  U extends z.ZodType | undefined = undefined,
> {
  onRowAdd?: (
    value: InferZodType<T>,
    extras: InferZodTypeOrUndefined<U>,
  ) => void;
  onRowUpdate?: (
    idx: number,
    value: InferZodType<T>,
    extras: InferZodTypeOrUndefined<U>,
  ) => void;
  onRowDelete?: (
    idx: number,
    value: InferZodType<T>,
    extras: InferZodTypeOrUndefined<U>,
  ) => void;
  onExtrasRequest?: (
    row: InferZodType<T>,
  ) => MaybePromise<Result<InferZodTypeOrUndefined<U>, string>>;
}

export type TableColumnDefType<T extends z.ZodType> = Array<
  ColumnDef<InferPaginationType<T>["payload"][number]>
>;

export interface TableProps<
  T extends z.ZodType,
  U extends z.ZodType | undefined = undefined,
> extends TableMutationFunctions<T, U> {
  rows: InferPaginationType<T>;
  pagination: PaginationState;
  sorting?:SortingState;
  rowSelection?:RowSelectionState,
  columnFilters?: ColumnFiltersState;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  onSortingChange?:(updater:Updater<SortingState>)=>void;
  onRowSelectionChange?:(updater:Updater<RowSelectionState>)=>void;
  onFiltersChange?: (updater: Updater<ColumnFiltersState>) => void;

  emptyUI?: ReactNode;
  buildColumnDef: (
    fns: TableMutationFunctions<T, U>,
  ) => Array<ColumnDef<InferPaginationType<T>["payload"][number]>>;
}
