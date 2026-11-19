import { Spinner } from "./spinner";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "cn";

// the transition delay keeps it hidden for navigations that finish within half a second
export function NavigationSpinner() {
  const isNavigating = useRouterState({
    select: (state) => state.status === "pending",
  });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-99999999 h-80 w-full select-none"
    >
      <div
        className={cn(
          "absolute top-0 h-80 w-full rounded-[100%] bg-black/25 blur-3xl transition-[translate,opacity] duration-500",
          isNavigating ? "-translate-y-1/2 opacity-100 delay-500" : "-translate-y-full opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute top-6 left-1/2 -translate-x-1/2 transition-[translate,opacity] duration-300",
          isNavigating ? "translate-y-0 opacity-100 delay-500" : "-translate-y-6 opacity-0",
        )}
      >
        {isNavigating && <Spinner />}
      </div>
    </div>
  );
}
