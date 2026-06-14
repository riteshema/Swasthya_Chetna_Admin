"use client";

import { useMemo, useState, type JSX } from "react";
import {
  getCoreRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/react-table";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QuerySchema } from "@dto/query_type";
import { QueryRepository } from "@repositories/query_repository";

import { Edit, Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";

import { type RowAction } from "@lib/row_action";
import { type InferZodType } from "@lib/infer_zod_schema";

import { FilterParser } from "@lib/filter";
import { build_deep_partial_schema } from "@lib/build_partial_schema";
import { type FiltersWithPage } from "@type/filters_with_page";

import { useExtendedReactTable } from "@hooks/use_extended_react_table";
import DataTable from "./commons/data_table";
import TableSkeleton from "./commons/table_skeleton";
import ErrorState from "./commons/table_error_state";

import QueryForm from "@components/forms/query_form";
import { CRC32 } from "@lib/crc32";
import z from "zod";

interface Props {
  filters: FiltersWithPage<typeof QuerySchema> | null;
}

const query_repo = QueryRepository.for_client();

const parser = new FilterParser(
  build_deep_partial_schema(
    QuerySchema.omit({ email: true }).extend({
      email: z.string(),
    }),
  ),
  { array_encoding: "comma" },
);

export default function QueryTable({ filters }: Props): JSX.Element {
  const query_client = useQueryClient();

  const [row_action, set_row_action] =
    useState<RowAction<InferZodType<typeof QuerySchema>> | null>(null);

  const [pagination, set_pagination] = useState<PaginationState>({
    pageIndex: filters?.page ? filters.page - 1 : 0,
    pageSize: filters?.limit ?? 10,
  });

  const [column_filters, set_column_filters] =
    useState<ColumnFiltersState>(() => {
      if (!filters) return [];
      const { page, limit, ...rest } = filters;
      return parser.to_column_filters_state(rest).unwrap();
    });

  const query_key = useMemo(
    () => ["queries", pagination.pageIndex, column_filters],
    [pagination.pageIndex, column_filters],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: query_key,
    queryFn: async () => {
      const fil = parser.from_column_filters_state(column_filters).unwrap();

      const result = await query_repo.get_all_queries({
        page_limit: pagination.pageSize,
        current_page: pagination.pageIndex,
        filters: fil,
      });

      if (result.is_err()) throw new Error(result.error);
      return result.value;
    },
  });

  const handle_delete = async (id: number) => {
    const result = await query_repo.delete_query(id);

    if (result.is_err()) {
      toast.error(result.error);
      return;
    }

    toast.success("Query deleted successfully");
    await query_client.invalidateQueries({ queryKey: ["queries"] });
  };

  const columns = useMemo<ColumnDef<InferZodType<typeof QuerySchema>>[]>(
    () => [
      {
        id: "full_name",
        accessorKey: "full_name",
        header: "Name",
        meta: { filter: { type: "text" } },
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.full_name || "—"}
          </span>
        ),
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        meta: { filter: { type: "text" } },
      },
      {
        id: "whatsapp_number",
        accessorKey: "whatsapp_number",
        header: "WhatsApp",
        meta: { filter: { type: "text" } },
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        meta: {
          filter: {
            type: "select",
            options: [
              { name: "Pending", value: "pending" },
              { name: "In Progress", value: "in_progress" },
              { name: "Resolved", value: "resolved" },
              { name: "Rejected", value: "rejected" },
            ],
          },
        },
        cell: ({ row }) => (
          <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
            {row.original.status ?? "pending"}
          </span>
        ),
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created At",
        meta: { filter: { type: "date" } },
        cell: ({ row }) =>
          row.original.created_at
            ? new Date(row.original.created_at).toLocaleString()
            : "—",
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() =>
                set_row_action({
                  action: "update",
                  index: row.index,
                  row: row.original,
                })
              }
            >
              <Edit className="size-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => handle_delete(row.original.id)}
            >
              <Trash2 className="size-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useExtendedReactTable<InferZodType<typeof QuerySchema>>({
    data: data?.payload ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    rowCount: data?.meta.total ?? 0,
    pageCount: data
      ? Math.ceil(data.meta.total / pagination.pageSize)
      : 0,
    state: { pagination, columnFilters: column_filters },
    onPaginationChange: set_pagination,
    onColumnFiltersChange: set_column_filters,
  });

  return (
    <div className="flex flex-col gap-5">
      {isLoading ? (
        <TableSkeleton row={10} />
      ) : isError || !data ? (
        <ErrorState error={error} />
      ) : (
        <DataTable
          key={CRC32.hash_value(data.payload ?? []).hex}
          table={table}
        />
      )}

      <QueryForm
        open={row_action !== null}
        onOpenChange={(open) => {
          if (!open) set_row_action(null);
        }}
        rowAction={row_action}
        onSubmit={async (action) => {
          if (action.action === "update") {
            const result = await query_repo.update_query(
              action.row.id,
              action.row,
            );

            if (result.is_err()) {
              toast.error(result.error);
              return;
            }

            toast.success("Query updated successfully");
            await query_client.invalidateQueries({ queryKey: ["queries"] });
          }
          set_row_action(null);
        }}
      />
    </div>
  );
}