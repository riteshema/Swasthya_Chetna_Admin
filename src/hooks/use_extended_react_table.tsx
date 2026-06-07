import {
  useReactTable,
  type TableOptions,
  type Table,
  type RowData,
  type TableMeta,
} from "@tanstack/react-table";

export type ExtendedTableOptions<
  TData extends RowData,
  TExtras = undefined,
> = Omit<TableOptions<TData>, "meta"> & {
  meta?: TableMeta<TData, TExtras>;
};

export type TableWithExtras<TData extends RowData, TExtras> = Table<TData> & {
  options: ExtendedTableOptions<TData, TExtras>;
};

export function useExtendedReactTable<
  TData extends RowData,
  TExtras = undefined,
>(
  options: ExtendedTableOptions<TData, TExtras>,
): TableWithExtras<TData, TExtras> {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable(options as unknown as TableOptions<TData>);
  return table as unknown as TableWithExtras<TData, TExtras>;
}
