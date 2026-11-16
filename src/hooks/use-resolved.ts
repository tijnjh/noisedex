import { useEffect, useState } from "react";

// undefined while the promise is pending, and when it rejects
export function useResolved<T>(value: T | Promise<T>): T | undefined {
  return useResolvedState(value).value;
}

export function useResolvedState<T>(value: T | Promise<T>): {
  value: T | undefined;
  pending: boolean;
} {
  const [resolved, setResolved] = useState<{ source: Promise<T>; value: T | undefined }>();

  useEffect(() => {
    if (!(value instanceof Promise)) return;

    let active = true;
    void value.then(
      (result) => {
        if (active) setResolved({ source: value, value: result });
      },
      () => {
        if (active) setResolved({ source: value, value: undefined });
      },
    );

    return () => {
      active = false;
    };
  }, [value]);

  if (!(value instanceof Promise)) return { value, pending: false };
  if (resolved?.source !== value) return { value: undefined, pending: true };
  return { value: resolved.value, pending: false };
}
