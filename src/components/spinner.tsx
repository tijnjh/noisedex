import { cn } from "cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "size-9 animate-spin rounded-full border-4 border-zinc-300-700 border-t-zinc-600-400",
        className,
      )}
    />
  );
}
