import { Fragment, type JSX, type ReactNode } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { Skeleton } from "@components/ui/skeleton";

interface TableLoadingProps {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  children: ReactNode;
  errorTitle?: string;
  errorMessage?: string;
}

export default function TableLoading({
  isLoading,
  isError,
  error,
  children,
  errorTitle = "Failed to load data",
  errorMessage = "An unexpected error occurred while fetching records.",
}: TableLoadingProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="w-full space-y-3">
        <div className="rounded-xl border">
          <div className="grid grid-cols-6 gap-4 border-b px-4 py-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>

          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-6 gap-4 border-b px-4 py-4 last:border-b-0"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-64 items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50/40 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangleIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold tracking-tight text-red-950">
                {errorTitle}
              </h2>

              <p className="mt-1 text-sm text-red-800/80">{errorMessage}</p>

              {error?.message && (
                <div className="mt-4 overflow-hidden rounded-xl border border-red-200 bg-white">
                  <div className="border-b border-red-100 px-3 py-2 text-xs font-medium tracking-wide text-red-500 uppercase">
                    Error Details
                  </div>

                  <pre className="overflow-x-auto p-3 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-slate-700">
                    {error.message}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Fragment>{children}</Fragment>;
}
