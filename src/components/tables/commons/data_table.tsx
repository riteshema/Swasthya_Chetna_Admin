"use client";
"use no memo";
import { Button } from "@components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { type TableWithExtras } from "@hooks/index";
import { type Column, flexRender } from "@tanstack/react-table";
import {
  CalendarIcon,
  ChevronDown,
  Calendar1,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUp,
  SearchIcon,
  XIcon,
} from "lucide-react";

import { Fragment, type JSX, useEffect, useMemo,useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@components/ui/select";
import { cn } from "@lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@components/ui/input-group";
import { Separator } from "@components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";
import { format, parseISO, isValid,set } from "date-fns";
import { Input } from "@components/ui/input";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { Calendar } from "@components/ui/calendar";

interface DataTableProps<T, U> {
  table: TableWithExtras<T, U>;
  show_pagination?: boolean;
}

interface FilterProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: Column<any, unknown>;
  columnName?: string;
}

function TextFilter({
  columnName,
  value,
  onChange,
}: Readonly<{
  columnName?: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}>): JSX.Element {
  const changeRef = useRef(onChange);
  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);
  const [local_value, setLocalValue] = useState<string | undefined>(value);

  const [debounced_value] = useDebounce<string | undefined>(local_value, 700);

  useEffect(() => {
    changeRef.current(
      debounced_value === undefined || debounced_value.length === 0
        ? undefined
        : debounced_value,
    );
  }, [debounced_value]);

  return (
    <InputGroup className={"mt-2 w-56 bg-white"}>
      <InputGroupInput
        type={"text"}
        placeholder={columnName ? `Search ${columnName}...` : "Search..."}
        value={local_value ?? ""}
        onChange={(e) => setLocalValue(e.target.value)}
        className={"m-0 py-1 text-[0.75rem] text-gray-500"}
      />
      <InputGroupAddon>
        <SearchIcon className={"ms-1 text-gray-500"} size={16} />
      </InputGroupAddon>
      <InputGroupButton
        hidden={local_value === undefined || local_value?.length === 0}
        variant={"destructive"}
        size={"icon-xs"}
        className={cn("mr-1")}
        onClick={() => {
          setLocalValue(undefined);
          onChange(undefined);
        }}
      >
        <XIcon />
      </InputGroupButton>
    </InputGroup>
  );
}

function DateFilter({
  value,
  onChange,
}: Readonly<{
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}>): JSX.Element {
  const selected_date =
    value && isValid(parseISO(value)) ? parseISO(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger>
        <InputGroup className="mt-2 w-44 cursor-pointer bg-white">
          <InputGroupAddon>
            <CalendarIcon className="ms-1 text-gray-500" size={16} />
          </InputGroupAddon>
          <InputGroupInput
            readOnly
            type="text"
            value={selected_date ? format(selected_date, "dd-MM-yyyy") : ""}
            placeholder="Pick a date"
            className="m-0 cursor-pointer py-1 text-[0.75rem] text-gray-500"
          />
          {selected_date && (
            <span
              role="button"
              className="bg-destructive text-destructive-foreground mr-1 flex items-center justify-center rounded-sm p-0.5 hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
            >
              <XIcon size={18} />
            </span>
          )}
        </InputGroup>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected_date}
          onSelect={(date) =>
            onChange(date ? format(date, "yyyy-MM-dd") : undefined)
          }
        />
      </PopoverContent>
    </Popover>
  );
}
function SelectFilter({
  selected,
  options,
  onChange,
}: Readonly<{
  selected: string | null | undefined;
  options: Array<{ name: string; value: string }>;
  onChange: (value: string | undefined) => void;
}>): JSX.Element {
  return (
    <Select
      value={selected || ""}
      onValueChange={(option) => onChange(option || undefined)}
    >
      <div
        className={cn(
          "ml-3 flex items-center space-x-1 rounded-full bg-white px-1",
          selected !== undefined && "bg-input/40 border",
        )}
      >
        <SelectTrigger
          className={selected !== undefined ? `border-none bg-transparent` : ""}
        />
      </div>
      <SelectContent>
        {options.map(({ name, value }) => (
          <SelectItem key={value} value={value}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TimeFilter({
  onChange,
  value,
  columnName,
}: Readonly<{
  columnName?: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}>): JSX.Element {
  return (
    <InputGroup className={"mt-2 w-56 bg-white"}>
      <InputGroupInput
        type={"time"}
        placeholder={columnName ? `Search ${columnName}...` : "Search..."}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={"m-0 py-1 text-[0.75rem] text-gray-500"}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <InputGroupAddon>
        <SearchIcon className={"ms-1 text-gray-500"} size={16} />
      </InputGroupAddon>
      <InputGroupButton
        hidden={value === undefined || value?.length === 0}
        variant={"destructive"}
        size={"icon-xs"}
        className={cn("mr-1")}
        onClick={() => {
          onChange(undefined);
        }}
      >
        <XIcon />
      </InputGroupButton>
    </InputGroup>
  );
}

function DateTimeFilter({
  onChange,
  value,
  columnName
}: Readonly<{
  columnName?: string;
  value: Date | undefined;
  onChange: (val: Date | undefined) => void;
}>): JSX.Element {
  const time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [open, set_open] = useState<boolean>(false);
  const time = useMemo(() => {
    return value ? format(value, "HH:mm") : "";
  }, [value]);

  const display = useMemo(() => {
    return value ? format(value, "MM/dd/yyyy hh:mm aa") : "";
  }, [value]);
  const merge = (date: Date | undefined, t: string): Date | undefined => {
    if (!date) {
      return undefined;
    }

    const [h, m] = t.split(":").map(Number);

    return fromZonedTime(
      set(toZonedTime(date, time_zone), {
        hours: isNaN(h) ? 0 : h,
        minutes: isNaN(m) ? 0 : m,
        seconds: 0,
        milliseconds: 0,
      }),
      time_zone,
    );
  };
  return (
    <div className="mt-2 w-56 bg-white">
      <Popover open={open} onOpenChange={set_open}>
        <PopoverTrigger>
          <div className="w-full" onClick={() => set_open(true)}>
            <InputGroup>
              <InputGroupInput
                readOnly
                value={display}
                placeholder={
                  columnName ? `Search ${columnName}...` : "Search..."
                }
                className="text-gray-500"
              />
              <InputGroupAddon>
                <Calendar1 className={"ms-1 text-gray-500"} size={16} />
              </InputGroupAddon>
              <span
                hidden={value === undefined}
                className={cn(
                  "bg-destructive text-destructive-foreground mr-1 flex items-center justify-center rounded-sm p-0.5 hover:opacity-80",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                }}
              >
                <XIcon size={18} />
              </span>
            </InputGroup>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              if (!d) {
                return;
              }

              const result = merge(d, time);

              if (result) {
                onChange(result);
              }
              set_open(false);
            }}
            className="p-0"
          />
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <span className="text-muted-foreground text-xs">Time</span>
            <Input
              type="time"
              value={time}
              onChange={(e) => {
                const result = merge(value, e.target.value);
                if (result) {
                  onChange(result);
                }
              }}
              className="h-8 flex-1 rounded-md border px-2 text-sm outline-none focus:ring-1"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Filter({ column, columnName }: Readonly<FilterProps>): JSX.Element {
  const { filter } = column.columnDef.meta ?? {};

  const filter_value = column.getFilterValue();

  if (filter?.type === "text") {
    const text_value =
      typeof filter_value === "string" ? filter_value : undefined;

    return (
      <TextFilter
        columnName={
          (filter.showColumnNameInPlaceholder ?? true) ? columnName : undefined
        }
        value={text_value}
        onChange={(val) => {
          column.setFilterValue(val);
        }}
      />
    );
  }

  if (filter?.type === "select") {
    const selected_value =
      Array.isArray(filter_value) && filter_value.length !== 0
        ? String(filter_value[0])
        : undefined;
    return (
      <SelectFilter
        options={filter.options}
        selected={selected_value}
        onChange={(val) => {
          column.setFilterValue(val === undefined ? undefined : [val]);
        }}
      />
    );
  }
  if (filter?.type === "date") {
    const date_value =
      typeof filter_value === "string" ? filter_value : undefined;

    return (
      <DateFilter
        value={date_value}
        onChange={(val) => {
          column.setFilterValue(val);
        }}
      />
    );
  }
  if (filter?.type === "time") {
    const text_value =
      typeof filter_value === "string" ? filter_value : undefined;
    return (
      <TimeFilter
        columnName={
          (filter.showColumnNameInPlaceholder ?? true) ? columnName : undefined
        }
        value={text_value}
        onChange={(val) => {
          column.setFilterValue(val);
        }}
      />
    );
  }

  if (filter?.type === "date_time") {
    const date_value =
      typeof filter_value === "string" ? new Date(filter_value) : undefined;
    return (
      <DateTimeFilter
        columnName={
          (filter.showColumnNameInPlaceholder ?? true) ? columnName : undefined
        }
        value={date_value}
        onChange={(val) => column.setFilterValue(val?.toISOString())}
      />
    );
  }

  return <Fragment />;
}

export default function DataTable<T, U>({
  table,
  show_pagination = true,
}: Readonly<DataTableProps<T, U>>): JSX.Element {
  return (
    <Fragment>
      <div className="bg-card m-0 rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={"bg-gray-100/30"}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={"text-sidebar-accent-foreground p-0 align-top"}
                    style={{ width: `${header.getSize()}px` }}
                  >
                    <div className={"flex flex-col"}>
                      <Fragment>
                        <div className={"min-h-8 px-1.5 py-1.5"}>
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <div className="flex items-center gap-2 text-[0.70rem] font-semibold text-gray-500 uppercase">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}

                              <div
                                className="cursor-pointer"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {header.column.getIsSorted() === "asc" ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <span className="flex flex-col justify-center">
                                    <ChevronUp className="h-3 w-3" />
                                    <ChevronDown className="-mt-1 h-3 w-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span
                              className={
                                "text-[0.70rem] font-semibold text-gray-500 uppercase"
                              }
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </span>
                          )}
                        </div>
                        <Separator />
                      </Fragment>
                      {header.column.getCanFilter() ? (
                        <div className="px-1.5 pb-1.5">
                          <Filter
                            column={header.column}
                            columnName={
                              typeof header.column.columnDef.header === "string"
                                ? header.column.columnDef.header
                                : undefined
                            }
                          />
                        </div>
                      ) : (
                        <Fragment />
                      )}
                      {header.column.columnDef.meta?.element?.(table)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  <span>No Results</span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {show_pagination ? (
        <div className={"mt-1 flex items-center justify-end space-x-3 py-1"}>
          <div>
            <span className={"text-muted-foreground text-[0.9rem]"}>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount().toLocaleString()}
            </span>
          </div>
          <div className={"flex items-center space-x-2"}>
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronFirstIcon />
            </Button>
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon />
            </Button>
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronLastIcon />
            </Button>
          </div>
        </div>
      ) : (
        <Fragment />
      )}
    </Fragment>
  );
}