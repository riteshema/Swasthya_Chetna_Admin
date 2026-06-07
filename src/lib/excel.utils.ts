import * as XLSX from "xlsx";
import { type ColumnDef } from "@tanstack/react-table";

type AnyRow = Record<string, unknown>;

function get_visible_columns<T>(columns: ColumnDef<T>[]): ColumnDef<T>[] {
  return columns.filter((col) => col.id !== "select" && col.id !== "action");
}

function rows_to_plain<T extends AnyRow>(
  rows: T[],
  columns: ColumnDef<T>[],
): AnyRow[] {
  const visible = get_visible_columns(columns);

  return rows.map((row) =>
    Object.fromEntries(
      visible.map((col) => {
        const key =
          (col as { accessorKey?: string }).accessorKey ?? col.id ?? "";
        const header =
          typeof col.header === "string" ? col.header : (col.id ?? key);
        const raw = row[key];

        const value =
          raw instanceof Date
            ? new Intl.DateTimeFormat("en-GB").format(raw)
            : raw instanceof Date === false &&
                typeof raw === "string" &&
                !isNaN(Date.parse(raw)) &&
                key.includes("date")
              ? new Intl.DateTimeFormat("en-GB").format(new Date(raw))
              : (raw ?? "");

        return [header, value];
      }),
    ),
  );
}

export function download_excel<T extends AnyRow>(
  rows: T[] | undefined,
  columns: ColumnDef<T>[],
  filename = "export",
): void {
  if(rows===undefined){
    return;
  }
  const data = rows_to_plain(rows, columns);
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function download_csv<T extends AnyRow>(
  rows: T[] | undefined,
  columns: ColumnDef<T>[],
  filename = "export",
): void {
  if(rows===undefined){
    return;
  }
  const data = rows_to_plain(rows, columns);
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
