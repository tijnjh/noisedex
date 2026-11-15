import { useEffect, useState } from "react";

/**
 * unwraps a value that may still be a promise, without suspending:
 * yields undefined until the promise settles (and if it rejects)
 */
export function useResolved<T>(value: T | Promise<T>): T | undefined {
  const [resolved, setResolved] = useState<{ source: Promise<T>; value: T }>();

  useEffect(() => {
    if (!(value instanceof Promise)) return;

    let active = true;
    void value.then(
      (result) => {
        if (active) setResolved({ source: value, value: result });
      },
      () => {},
    );

    return () => {
      active = false;
    };
  }, [value]);

  if (!(value instanceof Promise)) return value;
  return resolved?.source === value ? resolved.value : undefined;
}
