import { useState } from "react";

export function useEnumToggle<const T extends readonly [string, ...string[]]>(
  values: T,
  opts?: {
    defaultValue: string;
    onUpdate: (newValue: T[number]) => void;
  },
) {
  const [localValue, setLocalValue] = useState<T[number]>(values[0]);
  // URL-backed toggles follow navigation, including the back/forward buttons.
  const value = opts ? opts.defaultValue : localValue;
  const index = Math.max(0, values.indexOf(value));

  return {
    current: values[index] as T[number],
    cycle: () => {
      const next = values[(index + 1) % values.length];
      if (opts) opts.onUpdate(next);
      else setLocalValue(next);
    },
  };
}
