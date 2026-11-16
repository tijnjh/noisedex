import { DAY, HOUR } from "./time.ts";

const maxEntries = 500;

// values are fresh for `freshMs`, then served up to `staleMs` while revalidating in the background
export function cached<Args extends unknown[], T>(
  load: (...args: Args) => Promise<T>,
  { freshMs, staleMs } = { freshMs: HOUR, staleMs: DAY },
) {
  const entries = new Map<string, { value: T; freshUntil: number; staleUntil: number }>();
  const pending = new Map<string, Promise<T>>();

  return async (...args: Args): Promise<T> => {
    const key = JSON.stringify(args);
    const entry = entries.get(key);
    if (entry && entry.freshUntil > Date.now()) return entry.value;

    let refresh = pending.get(key);

    if (!refresh) {
      refresh = load(...args)
        .then((value) => {
          const now = Date.now();
          entries.delete(key);
          entries.set(key, { value, freshUntil: now + freshMs, staleUntil: now + staleMs });
          if (entries.size > maxEntries) entries.delete(entries.keys().next().value!);
          return value;
        })
        .finally(() => pending.delete(key));
      pending.set(key, refresh);
    }

    if (entry && entry.staleUntil > Date.now()) {
      refresh.catch(() => {});
      return entry.value;
    }

    return refresh;
  };
}
