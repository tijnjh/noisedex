import { Spinner } from "./spinner";
import type { UseQueryResult } from "@tanstack/react-query";
import { Suspense, type ReactNode } from "react";

export function AsyncView<T extends UseQueryResult>({
  query,
  children,
}: {
  query: T;
  children: (arg: NonNullable<T["data"]>) => ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingView />}>
      {query.status === "error" ? (
        <div className="grid size-full grow place-items-center">
          <div className="max-w-xl bg-red-200 p-4 text-red-700">
            {query.error?.message}
          </div>
        </div>
      ) : query.data != null ? (
        children(query.data)
      ) : (
        <LoadingView />
      )}
    </Suspense>
  );
}

function LoadingView() {
  return (
    <div className="grid size-full grow cursor-wait place-items-center">
      <Spinner />
    </div>
  );
}
