import { Skeleton } from "@components/ui/skeleton";
import { type JSX } from "react";
interface TableSkeletonProps {
  row?: number;
}

export default function TableSkeleton({
  row = 6,
}: TableSkeletonProps): JSX.Element {
  return (
    <div>
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

          {Array.from({ length: row }).map((_, i) => (
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
    </div>
  );
}
