"use client";

import { Fragment, useMemo, type JSX } from "react";
import DataTable from "./data_table";
import { type TableProps } from "@type/table_props";
import { useExtendedReactTable } from "@hooks/use_extended_react_table";
import { getCoreRowModel } from "@tanstack/react-table";
import { CRC32 } from "@lib/crc32";
import type z from "zod";
import { type InferZodType } from "@lib/infer_zod_schema";

export default function InnerTable<
  T extends z.ZodType,
  U extends z.ZodType | undefined = undefined,
>({
  rows,
  pagination,
  columnFilters,
  onPaginationChange,
  onFiltersChange,
  onRowAdd,
  onRowUpdate,
  onRowDelete,
  onExtrasRequest,
  buildColumnDef,
}: TableProps<T, U>): JSX.Element {
  const defs = useMemo(() => {
    return buildColumnDef({
      onRowAdd,
      onRowUpdate,
      onRowDelete,
      onExtrasRequest,
    });
  }, [buildColumnDef, onExtrasRequest, onRowAdd, onRowDelete, onRowUpdate]);

  const table = useExtendedReactTable<InferZodType<T>>({
    data: rows.payload,
    columns: defs,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    onPaginationChange,
    onColumnFiltersChange: onFiltersChange,
    rowCount: rows.meta.total,
    pageCount: Math.ceil(rows.meta.total / pagination.pageSize),
    state: {
      pagination,
      columnFilters,
    },
  });

  return (
    <Fragment>
      <DataTable key={`${CRC32.hash_value(rows.payload).hex}`} table={table} />
    </Fragment>
  );
}