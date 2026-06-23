"use client";

import { useMemo, useState, type JSX } from "react";
import {
  getCoreRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FilterParser } from "@lib/filter";
import { build_deep_partial_schema } from "@lib/build_partial_schema";
import { type FiltersWithPage } from "@type/filters_with_page";
import { toast } from "sonner";
import { PaymentSchema } from "@dto/payment_type";
import { PaymentRepository } from "@repositories/index";
import { Edit } from "lucide-react";
import { Button } from "@components/ui/button";
import { type RowAction } from "@lib/row_action";
import { type InferZodType } from "@lib/infer_zod_schema";
import { useExtendedReactTable } from "@hooks/use_extended_react_table";
import DataTable from "./commons/data_table";
import { CRC32 } from "@lib/crc32";
import TableSkeleton from "./commons/table_skeleton";
import ErrorState from "./commons/table_error_state";
import PaymentEditForm from "@components/forms/payment_form";
import z from "zod";
import { type DeepPartial } from "@type/deep_partial";

const PaymentFilterSchema = PaymentSchema.omit({
  approve: true,
  full_name: true,
  payment_amount: true,
}).extend({
  approve: z.string().optional(),
  full_name: z.string().optional(),
  payment_amount: z.string().optional(),
});

interface Props {
  filters: FiltersWithPage<typeof PaymentFilterSchema> | null;
}

const payment_repo = PaymentRepository.for_client();

const parser = new FilterParser(
  build_deep_partial_schema(PaymentFilterSchema),
  { array_encoding: "comma" },
);

export default function PaymentTable({ filters }: Props): JSX.Element {
  const query_client = useQueryClient();

  const [row_action, set_row_action] = useState<RowAction<InferZodType<typeof PaymentSchema>> | null>(null);

  const [pagination, set_pagination] = useState<PaginationState>({
    pageIndex: filters?.page ? filters.page - 1 : 0,
    pageSize: filters?.limit ?? 10,
  });

  const [column_filters, set_column_filters] = useState<ColumnFiltersState>(
    () => {
      if (!filters) return [];
      const { page, limit, ...rest } = filters;
      return parser.to_column_filters_state(rest).unwrap();
    },
  );

  const query_key = useMemo(
    () => ["payments", pagination.pageIndex, ...column_filters],
    [pagination.pageIndex, column_filters],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: query_key,
    queryFn: async () => {
      const raw_filters = parser.from_column_filters_state(column_filters).unwrap();
      const fil: InferZodType<DeepPartial<typeof PaymentSchema>> = {};

      if (typeof raw_filters.full_name === "string" && raw_filters.full_name.trim() !== "") {
        fil.full_name = raw_filters.full_name.trim();
      }

      if (typeof raw_filters.transaction_id === "string") {
        fil.transaction_id = raw_filters.transaction_id;
      }

      if (typeof raw_filters.payment_reason === "string") {
        fil.payment_reason = raw_filters.payment_reason;
      }

      if (
        typeof raw_filters.payment_method === "string" &&
        raw_filters.payment_method !== "all"
      ) {
        fil.payment_method = raw_filters.payment_method;
      }

      if (raw_filters.approve === "true") {
        fil.approve = true;
      } else if (raw_filters.approve === "false") {
        fil.approve = false;
      }

      if (
        typeof raw_filters.payment_amount === "string" &&
        raw_filters.payment_amount.trim() !== ""
      ) {
        fil.payment_amount = parseFloat(raw_filters.payment_amount);
      }

      const result = await payment_repo.get_all_payments({
        page_limit: pagination.pageSize,
        current_page: pagination.pageIndex,
        filters: fil,
      });

      if (result.is_err()) throw new Error(result.error);
      return result.value;
    },
  });

  const columns = useMemo<ColumnDef<InferZodType<typeof PaymentSchema>>[]>(
    () => [
      {
        id: "full_name",
        accessorKey: "full_name",
        header: "User Name",
        meta: { filter: { type: "text" } },
        cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900">
            {row.original.full_name?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "transaction_id",
        accessorKey: "transaction_id",
        header: "Transaction ID",
        meta: { filter: { type: "text" } },
        cell: ({ row }) => (
          <span className="font-mono text-xs text-gray-500">
            {row.original.transaction_id ?? "—"}
          </span>
        ),
      },
      {
        id: "payment_amount",
        accessorKey: "payment_amount",
        header: "Amount",
        meta: { filter: { type: "text" } },
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-gray-800">
            ₹{Number(row.original.payment_amount ?? 0).toFixed(2)}
          </span>
        ),
      },
      {
        id: "payment_method",
        accessorKey: "payment_method",
        header: "Method",
        meta: {
          filter: {
            type: "select",
            options: [
              { name: "All", value: "all" },
              { name: "UPI", value: "upi" },
              { name: "Bank Transfer", value: "bank_transfer" },
              { name: "Card", value: "card" },
              { name: "Cash", value: "cash" },
              { name: "Other", value: "other" },
            ],
          },
        },
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset">
            {row.original.payment_method ?? "—"}
          </span>
        ),
      },
      {
        id: "payment_reason",
        accessorKey: "payment_reason",
        header: "Reason",
        meta: { filter: { type: "text" } },
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.original.payment_reason ?? "—"}
          </span>
        ),
      },
      {
        id: "approve",
        accessorKey: "approve",
        header: "Status",
        meta: {
          filter: {
            type: "select",
            options: [
              { name: "All", value: "all" },
              { name: "Approved", value: "true" },
              { name: "Rejected", value: "false" },
            ],
          },
        },
        cell: ({ row }) => {
          if (row.original.approve === true) {
            return (
              <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-600/20 ring-inset">
                Approved
              </span>
            );
          }
          return (
            <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-600/20 ring-inset">
              Rejected
            </span>
          );
        },
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Submitted",
        cell: ({ row }) => {
          const d = row.original.created_at;
          return (
            <span className="text-sm text-gray-500">
              {d ? new Date(d).toLocaleDateString() : "—"}
            </span>
          );
        },
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center justify-end gap-2 pr-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() =>
                  set_row_action({ action: "update", index: row.index, row: r })
                }
                className="text-amber-500 hover:text-amber-600"
              >
                <Edit className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useExtendedReactTable<InferZodType<typeof PaymentSchema>>({
    data: data?.payload ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    rowCount: data?.meta.total ?? 0,
    enableSorting: false,
    pageCount: data ? Math.max(1, Math.ceil(data.meta.total / pagination.pageSize)) : 1,
    state: { pagination, columnFilters: column_filters },
    onPaginationChange: set_pagination,
    onColumnFiltersChange: (updater) => {
      set_column_filters(updater);
      set_pagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
  });

  return (
    <div className="flex flex-col gap-5">
      {isLoading ? (
        <TableSkeleton row={10} />
      ) : isError || data === undefined ? (
        <ErrorState error={error} />
      ) : (
        <DataTable
          key={CRC32.hash_value(data?.payload ?? []).hex}
          table={table}
        />
      )}

      <PaymentEditForm
        open={row_action !== null}
        onOpenChange={(open) => {
          if (!open) set_row_action(null);
        }}
        rowAction={row_action}
        onSubmit={async (payload) => {
          if (payload.action === "update") {
            const tid = toast.loading("Updating payment...");
            const result = await payment_repo.update_payment({
              ...payload.row,
              full_name: payload.row.full_name ?? "",
            });
            toast.dismiss(tid);
            if (result.is_err()) {
              toast.error(`Failed: ${result.error}`);
              return;
            }
            toast.success("Payment updated");
            await query_client.invalidateQueries({ queryKey: ["payments"] });
          }
          set_row_action(null);
        }}
      />
    </div>
  );
}