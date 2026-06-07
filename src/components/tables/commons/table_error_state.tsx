import { AlertTriangleIcon } from "lucide-react";
import { type JSX } from "react";

interface TableErrorStateProps {
  errorTitle?: string;
  errorMessage?: string;
  error: Error | null;
}

export default function TableErrorState({
  errorTitle,
  errorMessage,
  error,
}: TableErrorStateProps): JSX.Element {
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
