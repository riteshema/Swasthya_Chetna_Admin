"use client";

import { Fragment, type JSX, type ReactNode, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { type z } from "zod";

import type { Result } from "@lib/result";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@components/ui/button";
import { type InferPaginationType } from "@lib/pagination";

interface LazyContainerProps<S extends z.ZodType> {
  children: (items: z.infer<S>[]) => ReactNode;
  loader: (
    page: number,
    limit: number,
  ) => Promise<Result<InferPaginationType<S>, string>>;
  pageSize?: number;
  skeleton: ReactNode;
  startPage?: number;
  rootMargin?: string;
  threshold?: number | number[];
  className?: string;
  enabled?: boolean;
  cacheName?: readonly string[];
  emptyUI?: ReactNode;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
}

export default function LazyContainer<S extends z.ZodType>({
  children,
  loader,
  pageSize = 20,
  skeleton,
  startPage = 0,
  rootMargin = "200px",
  threshold = 0,
  className,
  enabled = true,
  cacheName = ["lazy-container"],
  emptyUI,
  refetchOnWindowFocus = false,
  refetchInterval,
}: Readonly<LazyContainerProps<S>>): JSX.Element {
  const { ref, inView } = useInView({ rootMargin, threshold });

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: cacheName,
    enabled,
    initialPageParam: startPage,
    refetchOnWindowFocus,
    refetchInterval,
    queryFn: async ({ pageParam }): Promise<InferPaginationType<S>> => {
      const res = await loader(pageParam, pageSize);

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

  const items: z.infer<S>[] = (data?.pages ?? []).flatMap((p) => p.payload);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isError) {
      fetchNextPage().catch(() => {
        /* errors are surfaced via isError/error */
      });
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, isError]);

  return (
    <div className={className}>
      <div hidden={isLoading ?? isError}>
        {items.length === 0 ? emptyUI : children(items)}
      </div>

      <div ref={ref} style={{ minHeight: 1 }}>
        {isError ? (
          <div
            className={"flex flex-col items-center justify-center space-y-3"}
          >
            <h6 className={"text-muted-foreground"}>Failed to load.</h6>
            <Button
              size={"sm"}
              variant={"outline"}
              onClick={() => fetchNextPage()}
            >
              Retry
            </Button>
          </div>
        ) : isLoading || isFetchingNextPage || hasNextPage ? (
          skeleton
        ) : (
          <Fragment />
        )}
      </div>
    </div>
  );
}
