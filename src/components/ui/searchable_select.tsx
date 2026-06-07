"use client";
import React, {
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
  useRef,
  Fragment,
} from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import type { z } from "zod";
import type { Result } from "@lib/result";
import type { InferPaginationType } from "@lib/pagination";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { ChevronDown, XIcon, Loader2 } from "lucide-react";
import { cn } from "@lib/utils";
import { useHotkeySequence, type Hotkey } from "@tanstack/react-hotkeys";
import { type InferZodType } from "@lib/infer_zod_schema";
export interface SearchableSelectProps<
  S extends z.ZodType,
  F extends z.ZodType = S,
> {
  /** Loader function to load items based on search query, pagination, and optional filters */
  loader: (
    query: string,
    page: number,
    limit: number,
    filters?: InferZodType<F>,
  ) => Promise<Result<InferPaginationType<S>, string>>;

  /** External filter object to pass down to the loader (triggers a refetch when changed) */
  filters?: InferZodType<F>;

  /** Key of the field used for equality checks (unique identifier) */
  valueKey: keyof InferZodType<S> & string;

  /** Keys to search against when filtering (maintains type safety) */
  searchKeys?: (keyof InferZodType<S> & string)[];

  /** Custom render function for each option */
  renderOption: (item: InferZodType<S>, isSelected: boolean) => React.ReactNode;

  /** Custom render function for the selected value display (optional) */
  renderSelected?: (item: InferZodType<S>) => React.ReactNode;

  /** Callback when selection changes - returns the full item */
  onSelect?: (item: InferZodType<S> | null) => void;

  /** Number of items to fetch per page */
  pageSize?: number;

  /** Starting page parameter to pass to the loader. Defaults to 0 */
  startPage?: number;

  /** Base React Query cache key */
  cacheName?: readonly string[];

  /** Currently selected item (controlled mode) */
  value?: InferZodType<S> | null;

  /** Default item (uncontrolled mode) */
  defaultValue?: InferZodType<S>;

  /** Placeholder text */
  placeholder?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Whether selection can be cleared */
  clearable?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom className for the root container */
  className?: string;
  /** Custom className for the popover content */
  popoverClassName?: string;
  /** Shortcuts to open searchable select */
  shortcuts?: {
    open?: Hotkey[];
    clear?: Hotkey[];
  };
}
export default function SearchableSelect<
  S extends z.ZodType,
  F extends z.ZodType = S,
>(props: SearchableSelectProps<S, F>): React.ReactNode {
  const {
    loader,
    filters,
    pageSize = 20,
    startPage = 0,
    cacheName = ["searchable-select"],
    valueKey,
    renderOption,
    renderSelected,
    onSelect,
    value,
    defaultValue,
    placeholder = "Search or select...",
    emptyMessage = "No results found.",
    clearable = true,
    disabled = false,
    shortcuts,
    className,
    popoverClassName,
  } = props;

  type TItem = InferZodType<S>;

  const [open, set_open] = useState(false);
  const [query, set_query] = useState("");
  const [debounced_query] = useDebounce<string>(query, 500);
  const [internal_value, set_internal_value] = useState<TItem | null>(
    defaultValue ?? null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const is_controlled = value !== undefined;
  const selected_item = is_controlled ? value : internal_value;
  const handle_open_change = useCallback((new_open: boolean) => {
    set_open(new_open);
    if (!new_open) {
      set_query("");
    }
  }, []);
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [...cacheName, debounced_query, filters],
    enabled: open,
    initialPageParam: startPage,
    queryFn: async ({ pageParam }): Promise<InferPaginationType<S>> => {
      const res = await loader(debounced_query, pageParam, pageSize, filters);

      if (res.is_ok()) {
        return res.value;
      }

      throw new Error(res.error);
    },
    getNextPageParam: (lastPage): number | undefined => {
      return lastPage.meta.next_page === -1
        ? undefined
        : lastPage.meta.next_page;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.meta.previous_page === -1
        ? undefined
        : firstPage.meta.previous_page;
    },
  });

  const items: TItem[] = (data?.pages ?? []).flatMap((p) => p.payload);

  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: "200px",
    threshold: 0,
  });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isError) {
      fetchNextPage().catch(() => {});
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, isError]);
  const handle_clear = useCallback(
    (e?: MouseEvent | KeyboardEvent) => {
      e?.stopPropagation();
      if (!is_controlled) {
        set_internal_value(null);
      }
      onSelect?.(null);
    },
    [is_controlled, onSelect],
  );
  useHotkeySequence(shortcuts?.open ?? [], () => handle_open_change(true), {
    enabled: !disabled && !open && (shortcuts?.open?.length ?? 0) > 0,
  });
  useHotkeySequence(shortcuts?.clear ?? [], () => handle_clear(), {
    enabled:
      !disabled &&
      clearable &&
      !!selected_item &&
      (shortcuts?.clear?.length ?? 0) > 0,
  });
  useEffect(() => {
    if (!open) {
      return;
    }
    const timeout_id = window.setTimeout(() => {
      const input = containerRef.current?.querySelector("input");
      if (input) {
        input.focus({ preventScroll: true });
      }
    }, 0);
    return () => clearTimeout(timeout_id);
  }, [open]);
  const is_item_selected = useCallback(
    (item: TItem): boolean => {
      if (!selected_item) {
        return false;
      }
      return item[valueKey] === selected_item[valueKey];
    },
    [selected_item, valueKey],
  );
  const handle_select = useCallback(
    (item: TItem) => {
      if (!is_controlled) {
        set_internal_value(item);
      }
      onSelect?.(item);
      handle_open_change(false);
    },
    [is_controlled, onSelect, handle_open_change],
  );
  const display_value = selected_item ? selected_item[valueKey] : null;
  const clear_label = shortcuts?.clear?.length
    ? `Clear selection (${shortcuts.clear.join(" ")})`
    : "Clear selection";
  return (
    <div className={cn("min-w-56", className)}>
      <Popover open={open} onOpenChange={handle_open_change}>
        <div className={"flex w-fit items-center gap-2"}>
          <PopoverTrigger
            disabled={disabled}
            render={
              <Button
                variant={"outline"}
                className={"w-fit justify-between text-left text-xs"}
                aria-label={"Open searchable select"}
                type="button"
              >
                <span className="flex-1 truncate overflow-hidden">
                  {selected_item
                    ? (renderSelected?.(selected_item) ?? String(display_value))
                    : placeholder}
                </span>
                <span className="flex items-center gap-1">
                  <ChevronDown
                    className={cn(
                      "text-muted-foreground size-4 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </span>
              </Button>
            }
          />
          {clearable && selected_item && !disabled && (
            <XIcon
              className="text-muted-foreground hover:text-foreground size-4 cursor-pointer transition-colors"
              onClick={handle_clear}
              aria-label={clear_label}
            />
          )}
        </div>
        <PopoverContent className={cn("w-full max-w-md p-0", popoverClassName)}>
          <div ref={containerRef}>
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Type to filter..."
                value={query}
                onValueChange={set_query}
                autoFocus={false}
              />
              <CommandList>
                {!isLoading && !isError && items.length === 0 && (
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                )}
                <CommandGroup>
                  {items.map((item, index) => {
                    const is_selected = is_item_selected(item);
                    const item_key_value = item[valueKey];
                    const item_key = String(item_key_value) || `item-${index}`;
                    return (
                      <CommandItem
                        key={item_key}
                        value={item_key}
                        onSelect={() => handle_select(item)}
                        data-checked={is_selected}
                      >
                        {renderOption(item, is_selected)}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <div ref={loadMoreRef} className="h-1">
                  {isError ? (
                    <div className="flex flex-col items-center justify-center space-y-3 p-4">
                      <h6 className="text-muted-foreground text-sm">
                        Failed to load.
                      </h6>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchNextPage()}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : isLoading || isFetchingNextPage || hasNextPage ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="text-muted-foreground size-4 animate-spin" />
                    </div>
                  ) : (
                    <Fragment />
                  )}
                </div>
              </CommandList>
            </Command>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}