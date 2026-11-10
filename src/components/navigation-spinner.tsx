import { Spinner } from "./spinner";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "cn";
import { useEffect, useState } from "react";

export function NavigationSpinner() {
  const isNavigating = useRouterState({
    select: (state) => state.status === "pending",
  });

  const [showNavigationSpinner, setShowNavigationSpinner] = useState(false);

  useEffect(() => {
    if (!isNavigating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowNavigationSpinner(false); // FIXME
      return;
    }

    const timeout = setTimeout(() => setShowNavigationSpinner(true), 500);
    return () => clearTimeout(timeout);
  }, [isNavigating]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-99999999 h-80 w-full select-none"
    >
      {/* <div
        className={cn(
          "absolute top-0 h-80 w-full rounded-[100%] bg-black/25 blur-3xl transition-all duration-500",
          showNavigationSpinner
            ? "-translate-y-1/2 opacity-100"
            : "-translate-y-full opacity-0",
        )}
      /> */}

      {isNavigating && (
        <>
          <div className="mx-auto mt-9 flex h-control w-fit items-center gap-3 px-3 surface shadow-xl">
            <Spinner className="size-4 border-2" />
            loading...
          </div>
        </>
      )}

      {/*  <div
        className={cn(
          "absolute top-6 left-1/2 -translate-x-1/2 transition-all duration-300",
          showNavigationSpinner
            ? "translate-y-0 opacity-100"
            : "-translate-y-6 opacity-0",
        )}
      >
        {isNavigating && showNavigationSpinner && <Spinner />}
      </div> */}
    </div>
  );
}
