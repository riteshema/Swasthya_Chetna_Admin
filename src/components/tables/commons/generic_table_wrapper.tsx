/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Fragment, useMemo, useState, type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import type z from "zod";

import { Button } from "@components/ui/button";
import {
  type InferZodTypeOrUndefined,
  type InferZodType,
} from "@lib/infer_zod_schema";
import { type InferPaginationType } from "@lib/pagination";
import {
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/react-table";
import { type RowAction } from "@lib/row_action";
import { FilterParser } from "@lib/filter";
import {
  useCreateEntry,
  useDeleteEntry,
  useUpdateEntry,
} from "@hooks/infinite_cache";
import {
  type TableColumnDefType,
  type TableMutationFunctions,
} from "@type/table_props";
import { build_deep_partial_schema } from "@lib/build_partial_schema";
import InnerTable from "./inner_table";
import { type FiltersWithPage } from "@type/index";
import { AlertTriangleIcon } from "lucide-react";
import { Skeleton } from "@components/ui/skeleton";

interface GenericTableWrapperProps<
  T extends z.ZodType<{ id: string }, any, any>,
  Meta extends z.ZodType | undefined = undefined,
> {
  schema: T;
  filters: FiltersWithPage<T> | null;

  queryKeyPrefix: unknown[];

  fetchData: (params: {
    page: number;
    limit: number;
    columnFilters: ColumnFiltersState;
  }) => Promise<InferPaginationType<T>>;

  creator: (v: InferZodType<T>) => Promise<InferZodType<T>>;
  updator: (v: InferZodType<T>) => Promise<InferZodType<T>>;
  deletor: (v: InferZodType<T>) => Promise<InferZodType<T>>;

  buildColumnDef: (
    mutations: TableMutationFunctions<T, Meta>,
  ) => TableColumnDefType<T>;

  FormComponent: React.ComponentType<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rowAction: RowAction<InferZodType<T>, InferZodTypeOrUndefined<Meta>> | null;
    onSubmit: (
      payload: RowAction<InferZodType<T>, InferZodTypeOrUndefined<Meta>>,
    ) => void;
  }>;

  defaultNewRow: InferZodType<T>;
}

export default function GenericTableWrapper<
  T extends z.ZodType<{ id: string }, any, any>,
  Meta extends z.ZodType | undefined = undefined,
>({
  schema,
  filters,
  queryKeyPrefix,
  fetchData,
  creator,
  updator,
  deletor,
  buildColumnDef,
  FormComponent,
  defaultNewRow,
}: Readonly<GenericTableWrapperProps<T, Meta>>): JSX.Element {
  const parser = useMemo(
    () =>
      new FilterParser(build_deep_partial_schema(schema), {
        array_encoding: "comma",
      }),
    [schema],
  );

  const [row_action, setRowAction] = useState<RowAction<
    InferZodType<T>,
    InferZodTypeOrUndefined<Meta>
  > | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: filters?.page ? filters.page - 1 : 0,
    pageSize: filters?.limit ?? 10,
  });

  const [column_filters, setColumnFilters] = useState<ColumnFiltersState>(
    () => {
      if (!filters) {
        return [];
      }

      const { page, limit, ...restOfFilters } = filters;

      return parser.to_column_filters_state(restOfFilters).unwrap();
    },
  );

  const keys = useMemo(() => {
    return [...queryKeyPrefix, pagination.pageIndex, ...column_filters];
  }, [queryKeyPrefix, column_filters, pagination.pageIndex]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: keys,
    queryFn: async () => {
      const query_str =
        column_filters.length === 0
          ? ""
          : "&".concat(
              parser
                .to_query(
                  parser.from_column_filters_state(column_filters).unwrap(),
                )
                .unwrap(),
            );

      window.history.pushState(
        null,
        "",
        `?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}${query_str}`,
      );

      return fetchData({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        columnFilters: column_filters,
      });
    },
  });

  const create = useCreateEntry<InferZodType<T>>({
    keys,
    type: "finite-paginated",
    appendTo: "start",
    creator,
  });

  const update = useUpdateEntry<InferZodType<T>>({
    keys,
    type: "finite-paginated",
    updator,
  });

  const delete_row = useDeleteEntry<InferZodType<T>>({
    keys,
    type: "finite-paginated",
    deletor,
  });

  return (
    <div className={"flex flex-col space-y-5"}>
      <div className={"flex items-end justify-end"}>
        <Button
          disabled={create.isPending}
          onClick={() => {
            setRowAction({
              action: "add",
              row: defaultNewRow,
            } as RowAction<InferZodType<T>, InferZodTypeOrUndefined<Meta>>);
          }}
        >
          Add
        </Button>
      </div>
      {isLoading ? (
        <div className="w-full space-y-3">
          <div className="rounded-xl border">
            <div className="grid grid-cols-6 gap-4 border-b px-4 py-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>

            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-6 gap-4 border-b px-4 py-4 last:border-b-0"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : isError || data === undefined ? (
        <div className="flex min-h-64 items-center justify-center px-6 py-10">
          <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50/40 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold tracking-tight text-red-950">
                  Failed to load table data
                </h2>

                <p className="mt-1 text-sm text-red-800/80">
                  An unexpected error occurred while fetching records.
                </p>

                {error?.message && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-red-200 bg-white">
                    <div className="border-b border-red-100 px-3 py-2 text-xs font-medium tracking-wide text-red-500 uppercase">
                      Error Details
                    </div>

                    <pre className="overflow-x-auto p-3 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-slate-700">
                      {error.message}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Fragment>
          <InnerTable<T, Meta>
            rows={data}
            pagination={pagination}
            columnFilters={column_filters}
            onPaginationChange={setPagination}
            onFiltersChange={setColumnFilters}
            buildColumnDef={buildColumnDef}
            onRowUpdate={(idx, val, meta) => {
              setRowAction({
                action: "update",
                index: idx,
                row: val,
                meta,
              } as unknown as RowAction<
                InferZodType<T>,
                InferZodTypeOrUndefined<Meta>
              >);
            }}
            onRowDelete={(_idx, val, _meta) => {
              delete_row.mutate(val);
            }}
          />
          <FormComponent
            open={row_action !== null}
            onOpenChange={(open) => {
              if (!open) {
                setRowAction(null);
              }
            }}
            rowAction={row_action}
            onSubmit={(payload) => {
              if (payload.action === "add") {
                create.mutate(payload.row);
              }
              if (payload.action === "update") {
                update.mutate(payload.row);
              }
            }}
          />
        </Fragment>
      )}
    </div>
  );
}