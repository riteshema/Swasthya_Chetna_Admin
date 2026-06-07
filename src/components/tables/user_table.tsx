"use client";

import { Fragment, useMemo, useState, type JSX } from "react";
import {
  getCoreRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { FilterParser } from "@lib/filter";
import { build_deep_partial_schema } from "@lib/build_partial_schema";
import { type FiltersWithPage } from "@type/filters_with_page";
import { toast } from "sonner";
import { UserAdminSchema } from "@dto/user_type";
import { UserRepository } from "@repositories/index";
import { Edit, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@components/ui/button";
import { type RowAction } from "@lib/row_action";
import { type InferZodType } from "@lib/infer_zod_schema";
import { useUpdateEntry } from "@hooks/infinite_cache";
import { useExtendedReactTable } from "@hooks/use_extended_react_table";
import DataTable from "./commons/data_table";
import { CRC32 } from "@lib/crc32";
import TableSkeleton from "./commons/table_skeleton";
import ErrorState from "./commons/table_error_state";
import UserEditForm from "@components/forms/user_form";
import { string } from "zod";

interface Props {
  filters: FiltersWithPage<typeof UserAdminSchema> | null;
}

const user_repo = UserRepository.for_client();

const parser = new FilterParser(
  build_deep_partial_schema(
    UserAdminSchema.omit({ email: true }).extend({
      email: string(),
    }),
  ),
  { array_encoding: "comma" },
);

export default function UserTable({ filters }: Props): JSX.Element {
  const [row_action, set_row_action] = useState<RowAction<
    InferZodType<typeof UserAdminSchema>
  > | null>(null);

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
    () => ["users", pagination.pageIndex, ...column_filters],
    [pagination.pageIndex, column_filters],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: query_key,
    queryFn: async () => {
      const fil = parser.from_column_filters_state(column_filters).unwrap();
      
      fil.role_is_active =
        fil.status === "true" ? true : fil.status === "false" ? false : undefined;

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

      const result = await user_repo.get_all_users({
        page_limit: pagination.pageSize,
        current_page: pagination.pageIndex,
        filters: fil,
      });

      if (result.is_err()) throw new Error(result.error);
      return result.value;
    },
  });

  const update_user = useUpdateEntry<InferZodType<typeof UserAdminSchema>>({
    keys: query_key,
    type: "finite-paginated",
    updator: async (vals) => {
      const tid = toast.loading("Updating user...");
      const result = await user_repo.update_user(vals);
      toast.dismiss(tid);
      if (result.is_err()) {
        toast.error(`Failed: ${result.error}`);
        throw new Error(result.error);
      }
      toast.success("User updated");
      return vals;
    },
  });

  const handle_role_request = async (
    user: InferZodType<typeof UserAdminSchema>,
    status: "approved" | "rejected",
  ) => {
    const tid = toast.loading(
      status === "approved" ? "Approving..." : "Rejecting...",
    );
    const result = await user_repo.update_role_request({
      user_id: user.user_id,
      status,
    });
    toast.dismiss(tid);
    if (result.is_err()) {
      toast.error(`Failed: ${result.error}`);
      return;
    }
    toast.success(status === "approved" ? "Role approved" : "Role rejected");
  };

  const columns = useMemo<ColumnDef<InferZodType<typeof UserAdminSchema>>[]>(
    () => [
      {
        id: "first_name",
        accessorKey: "first_name",
        header: "Name",
        meta: { filter: { type: "text" } },
        cell: ({ row }) => {
          const r = row.original;
          return (
            <span className="font-medium text-gray-900">
              {[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}
            </span>
          );
        },
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        meta: { filter: { type: "text" } },
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">{row.original.email}</span>
        ),
      },
      {
        id: "role",
        accessorKey: "role",
        header: "Role",
        meta: {
          filter: {
            type: "select",
            options: [
              "all",
              "user",
              "health_provider",
              "educator",
              "event_organiser",
              "item_provider",
              "quiz_maker",
            ].map((v) => ({ name: v, value: v })),
          },
        },
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset">
            {row.original.role ?? "user"}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        meta: {
          filter: {
            type: "select",
            options: [
              { name: "All", value: "all" },
              { name: "Active", value: "true" },
              { name: "Inactive", value: "false" },
            ],
          },
        },
        cell: ({ row }) => {
          const active = row.original.role_is_active;
          return active ? (
            <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-600/20 ring-inset">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-500/10 ring-inset">
              Inactive
            </span>
          );
        },
      },
      {
        id: "role_request_status",
        accessorKey: "role_request_status",
        header: "Role Request",
        meta: {
          filter: {
            type: "select",
            options: [
              { name: "All", value: "all" },
              { name: "Pending", value: "pending" },
              { name: "Approved", value: "approved" },
              { name: "Rejected", value: "rejected" },
            ],
          },
        },
        cell: ({ row }) => {
          const r = row.original;
          if (!r.role_request_status)
            return <span className="text-gray-400">—</span>;

          if (r.role_request_status === "pending") {
            return (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                  Pending — {r.requested_role}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handle_role_request(r, "approved")}
                  className="text-teal-600 hover:text-teal-700"
                >
                  <CheckCircle className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handle_role_request(r, "rejected")}
                  className="text-rose-400 hover:text-rose-600"
                >
                  <XCircle className="size-4" />
                </Button>
              </div>
            );
          }

          return (
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                r.role_request_status === "approved"
                  ? "bg-teal-50 text-teal-700 ring-teal-600/20"
                  : "bg-rose-50 text-rose-700 ring-rose-600/20"
              }`}
            >
              {r.role_request_status}
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
    [update_user],
  );

  const table = useExtendedReactTable<InferZodType<typeof UserAdminSchema>>({
    data: data?.payload ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    rowCount: data?.meta.total ?? 0,
    enableSorting: false,
    pageCount: data ? Math.ceil(data.meta.total / pagination.pageSize) : 0,
    state: { pagination, columnFilters: column_filters },
    onPaginationChange: set_pagination,
    onColumnFiltersChange: set_column_filters,
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

      <UserEditForm
        open={row_action !== null}
        onOpenChange={(open) => {
          if (!open) set_row_action(null);
        }}
        rowAction={row_action}
        onSubmit={(payload) => {
          if (payload.action === "update") {
            update_user.mutate(payload.row);
          }
          set_row_action(null);
        }}
      />
    </div>
  );
}
