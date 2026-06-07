import { type RowData,type Table } from "@tanstack/react-table";
import { type ReactNode } from "react";
type MaybePromise<T> = T | Promise<T>;

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData, TExtras = undefined> {
    addRow: TExtras extends undefined
      ? (value: TData) => MaybePromise
      : (value: TData, extras: TExtras) => MaybePromise;

    updateRow: TExtras extends undefined
      ? (rowIndex: number, value: TData) => MaybePromise
      : (rowIndex: number, value: TData, extras: TExtras) => MaybePromise;
    deleteRow: TExtras extends undefined
      ? (rowIndex: number, value: TData) => MaybePromise
      : (rowIndex: number, value: TData, extras: TExtras) => MaybePromise;
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filter?:
      | {
          type: "text";
          showColumnNameInPlaceholder?: boolean;
        }
      | {
          type: "select";
          options: Array<{
            name: string;
            value: string;
          }>;
        }
        |
         {
          type:"date";
         }|
         {type:'time';
           showColumnNameInPlaceholder?: boolean;
        }|{
          type:'date_time';
          showColumnNameInPlaceholder?: boolean;
        };
        element?:(table:Table<TData>)=>ReactNode
  }
  
}
export type { MaybePromise };
