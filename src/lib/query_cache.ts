import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";

type PaginationMeta = {
  current_page: number;
  next_page: number;
  previous_page: number;
  total: number;
};

export type Page<TItem> = {
  meta: PaginationMeta;
  payload: TItem[];
};

export type InfinitePages<TItem> = InfiniteData<Page<TItem>, number>;

function ensure_pages<TItem>(
  old: InfinitePages<TItem> | undefined,
): InfinitePages<TItem> {
  if (old && old.pages.length > 0) {
    return old;
  }

  return {
    pages: [
      {
        meta: { current_page: 0, next_page: -1, previous_page: -1, total: 0 },
        payload: [],
      },
    ],
    pageParams: [0],
  };
}

export function create_infinite_list_cache<TItem>(opts: {
  queryClient: QueryClient;
  queryKey: QueryKey;
  getId: (item: TItem) => string | number;
}): {
  append_to_start: (item: TItem) => void;
  append_to_end: (item: TItem) => void;
  touch: (updated: TItem) => boolean;
  upsert_to_end: (item: TItem) => void;
  remove_if_present: (id: string | number) => void;
  invalidate: () => Promise<void>;
} {
  const { queryClient, queryKey, getId } = opts;

  function set(
    updater: (
      old: InfinitePages<TItem> | undefined,
    ) => InfinitePages<TItem> | undefined,
  ): void {
    queryClient.setQueryData<InfinitePages<TItem>>(queryKey, updater);
  }

  function append(item: TItem, position: "start" | "end"): void {
    const id = getId(item);

    set((old) => {
      const data = ensure_pages(old);

      // De-dupe across all cached pages
      const already = data.pages.some((p) =>
        p.payload.some((x) => getId(x) === id),
      );
      if (already) {
        return data;
      }

      const pages = [...data.pages];

      if (position === "start") {
        const first = pages[0];
        pages[0] = { ...first, payload: [item, ...first.payload] };
      } else {
        const last_idx = pages.length - 1;
        const last = pages[last_idx];
        pages[last_idx] = { ...last, payload: [...last.payload, item] };
      }

      return { ...data, pages };
    });
  }

  /** Prepend to the first cached page; no-op if already present. */
  function append_to_start(item: TItem): void {
    append(item, "start");
  }

  /** Append to the last cached page; no-op if already present. */
  function append_to_end(item: TItem): void {
    append(item, "end");
  }

  /** Replace item if found in any cached page; returns whether it existed. */
  function touch(updated: TItem): boolean {
    const id = getId(updated);
    let found = false;

    set((old) => {
      if (!old) {
        return old;
      }

      const pages = old.pages.map((p) => {
        let changed = false;

        const payload = p.payload.map((it) => {
          if (getId(it) !== id) {
            return it;
          }
          found = true;
          changed = true;
          return updated;
        });

        return changed ? { ...p, payload } : p;
      });

      return found ? { ...old, pages } : old;
    });

    return found;
  }

  /** Update if present; else append to end. */
  function upsert_to_end(item: TItem): void {
    const existed = touch(item);
    if (!existed) {
      append_to_end(item);
    }
  }

  function remove_if_present(id: string | number): void {
    set((old) => {
      if (!old) {
        return old;
      }

      let removed = false;

      const pages = old.pages.map((p) => {
        const before = p.payload.length;
        const payload = p.payload.filter((it) => getId(it) !== id);
        if (payload.length !== before) {
          removed = true;
        }
        return removed ? { ...p, payload } : p;
      });

      return removed ? { ...old, pages } : old;
    });
  }

  function invalidate(): Promise<void> {
    return queryClient.invalidateQueries({ queryKey });
  }

  return {
    append_to_start,
    append_to_end,
    touch,
    upsert_to_end,
    remove_if_present,
    invalidate,
  };
}

export type FiniteListCache<TItem> = {
  append_to_start: (item: TItem) => void;
  append_to_end: (item: TItem) => void;
  touch: (updated: TItem) => boolean;
  upsert_to_end: (item: TItem) => void;
  remove_if_present: (id: string | number) => void;
  invalidate: () => Promise<void>;
};

export function create_finite_list_cache<TData, TItem>(opts: {
  queryClient: QueryClient;
  queryKey: QueryKey;
  get_id: (item: TItem) => string | number;
  /** Extract the mutable item array from the cached data. */
  get_items: (data: TData) => TItem[];
  /** Return a new TData value with the item array replaced. */
  set_items: (data: TData, items: TItem[]) => TData;
}): FiniteListCache<TItem> {
  const { queryClient, queryKey, get_id, get_items, set_items } = opts;

  function set(updater: (old: TData | undefined) => TData | undefined): void {
    queryClient.setQueryData<TData>(queryKey, updater);
  }

  function append(item: TItem, position: "start" | "end"): void {
    const id = get_id(item);

    set((old) => {
      if (old === undefined) {
        return old;
      }

      const items = get_items(old);
      if (items.some((x) => get_id(x) === id)) {
        return old;
      }

      const next = position === "start" ? [item, ...items] : [...items, item];
      return set_items(old, next);
    });
  }

  /** Prepend to start; no-op if the item is already present (by id). */
  function append_to_start(item: TItem): void {
    append(item, "start");
  }

  /** Append to end; no-op if the item is already present (by id). */
  function append_to_end(item: TItem): void {
    append(item, "end");
  }

  /** Replace the item in-place if found; returns whether it existed. */
  function touch(updated: TItem): boolean {
    const id = get_id(updated);
    let found = false;

    set((old) => {
      if (old === undefined) {
        return old;
      }

      const items = get_items(old);
      const next = items.map((it) => {
        if (get_id(it) !== id) {
          return it;
        }
        found = true;
        return updated;
      });

      return found ? set_items(old, next) : old;
    });

    return found;
  }

  /** Update in-place if present; otherwise append to end. */
  function upsert_to_end(item: TItem): void {
    if (!touch(item)) {
      append_to_end(item);
    }
  }

  /** Remove by id; no-op if not found. */
  function remove_if_present(id: string | number): void {
    set((old) => {
      if (old === undefined) {
        return old;
      }

      const items = get_items(old);
      const next = items.filter((it) => get_id(it) !== id);

      return next.length !== items.length ? set_items(old, next) : old;
    });
  }

  function invalidate(): Promise<void> {
    return queryClient.invalidateQueries({ queryKey });
  }

  return {
    append_to_start,
    append_to_end,
    touch,
    upsert_to_end,
    remove_if_present,
    invalidate,
  };
}
