import {
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import {
  create_finite_list_cache,
  create_infinite_list_cache,
  type Page,
  type FiniteListCache,
} from "@lib/query_cache";

type Id = {
  id?: string | number;
  user_id?: string | number;
};

type InfiniteCacheConfig = {
  type?: "infinite";
};

type FiniteFlatConfig = {
  type: "finite";
};

type FinitePaginatedConfig = {
  type: "finite-paginated";
};

type FiniteCustomConfig<T, TData> = {
  type: "finite-custom";
  get_items: (data: TData) => T[];
  set_items: (data: TData, items: T[]) => TData;
};

type CacheConfig<T, TData> =
  | InfiniteCacheConfig
  | FiniteFlatConfig
  | FinitePaginatedConfig
  | FiniteCustomConfig<T, TData>;

function resolve_cache<T extends Id, TData>(
  config: CacheConfig<T, TData>,
  queryClient: ReturnType<typeof useQueryClient>,
  keys: Array<unknown>,
): FiniteListCache<T> {
  if (config.type === "finite") {
    return create_finite_list_cache<T[], T>({
      queryClient,
      queryKey: keys,
      get_id: (e) => e.id ?? e.user_id ?? "",
      get_items: (d) => d,
      set_items: (_, items) => items,
    });
  }

  if (config.type === "finite-paginated") {
    return create_finite_list_cache<Page<T>, T>({
      queryClient,
      queryKey: keys,
      get_id: (e) => e.id ?? e.user_id ?? "",
      get_items: (d) => d.payload,
      set_items: (d, items) => ({ ...d, payload: items }),
    });
  }

  if (config.type === "finite-custom") {
    return create_finite_list_cache<TData, T>({
      queryClient,
      queryKey: keys,
      get_id: (e) => e.id ?? e.user_id ?? "",
      get_items: config.get_items,
      set_items: config.set_items,
    });
  }

  return create_infinite_list_cache<T>({
    queryClient,
    queryKey: keys,
    getId: (e) => e.id ?? e.user_id ?? "",
  });
}

export function useCreateEntry<T extends Id, TData = never>(
  args: {
    keys: Array<unknown>;
    creator: (e: T) => Promise<T>;
    appendTo?: "start" | "end";
  } & CacheConfig<T, TData>,
): UseMutationResult<T, Error, T, unknown> {
  const query_client = useQueryClient();
  const cache = resolve_cache<T, TData>(args, query_client, args.keys);
  const append =
    args.appendTo === "start" ? cache.append_to_start : cache.append_to_end;

  return useMutation({
    mutationFn: (e: T) => args.creator(e),
    onSuccess: (actual) => append(actual),
  });
}

export function useUpdateEntry<T extends Id, TData = never>(
  args: { keys: Array<unknown>; updator: (e: T) => Promise<T> } & CacheConfig<
    T,
    TData
  >,
): UseMutationResult<T, Error, T, unknown> {
  const query_client = useQueryClient();
  const cache = resolve_cache<T, TData>(args, query_client, args.keys);

  return useMutation({
    mutationFn: (e: T) => args.updator(e),
    onSuccess: (actual) => cache.upsert_to_end(actual),
  });
}

export function useDeleteEntry<T extends Id, TData = never>(
  args: { keys: Array<unknown>; deletor: (e: T) => Promise<T> } & CacheConfig<
    T,
    TData
  >,
): UseMutationResult<T, Error, T, unknown> {
  const query_client = useQueryClient();
  const cache = resolve_cache<T, TData>(args, query_client, args.keys);

  return useMutation({
    mutationFn: (e: T) => args.deletor(e),
    onSuccess: (actual) => cache.remove_if_present(actual.id ?? actual.user_id ?? ""),
  });
}

export function useBulkUpdateEntry<
  T extends Id,
  TData = never,
>(
  args: {
    keys: Array<unknown>;
    updater: (vals: TData) => Promise<T>;
  } & CacheConfig<T, TData>,
): UseMutationResult<T, Error, TData, unknown> {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: (vals: TData) =>
      args.updater(vals),

    onSuccess: async() => {
      await query_client.invalidateQueries({
        queryKey:args.keys
      });
    },
  });
}

export function useCreateManyEntries<T extends Id, TData = never>(
  args: {
    keys: Array<unknown>;
    creator: (e: T[]) => Promise<T[]>;
    appendTo?: "start" | "end";
  } & CacheConfig<T, TData>,
): UseMutationResult<T[], Error, T[], unknown> {
  const query_client = useQueryClient();

  const cache = resolve_cache<T, TData>(
    args,
    query_client,
    args.keys,
  );

  const append =
    args.appendTo === "start"
      ? cache.append_to_start
      : cache.append_to_end;

  return useMutation({
    mutationFn: (e: T[]) => args.creator(e),

    onSuccess: (actual) => {
      actual.forEach((item) => append(item));
    },
  });
}