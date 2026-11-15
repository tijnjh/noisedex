import { DAY, HOUR } from "./time.ts";

export interface Lifetime {
  /** how long a value is served without revalidating */
  freshMs: number;
  /** how long a value may still be served while it revalidates in the background */
  staleMs: number;
}

interface SwrCacheOptions<T> {
  lifetime: Lifetime | ((value: T) => Lifetime);
  /**
   * when set, a failed load never rejects: it resolves to the last stale value
   * (or `fallback`), and the failure is remembered for `retryMs` before retrying
   */
  recover?: { fallback: T; retryMs: number };
  maxEntries?: number;
}

// bounded and per-process stale-while-revalidate cache with in-flight deduplication
export function createSwrCache<T>({ lifetime, recover, maxEntries = 500 }: SwrCacheOptions<T>) {
  const entries = new Map<string, { value: T; freshUntil: number; staleUntil: number }>();
  const pending = new Map<string, Promise<T>>();

  function store(key: string, value: T, freshUntil: number, staleUntil: number) {
    entries.delete(key);
    entries.set(key, { value, freshUntil, staleUntil });
    while (entries.size > maxEntries) entries.delete(entries.keys().next().value!);
    return value;
  }

  function usable(key: string) {
    const entry = entries.get(key);
    return entry && entry.staleUntil > Date.now() ? entry : undefined;
  }

  return (key: string, load: () => Promise<T>): Promise<T> => {
    const entry = usable(key);
    if (entry && entry.freshUntil > Date.now()) return Promise.resolve(entry.value);

    let refresh = pending.get(key);

    if (!refresh) {
      refresh = Promise.resolve()
        .then(load)
        .then(
          (value) => {
            const now = Date.now();
            const { freshMs, staleMs } =
              typeof lifetime === "function" ? lifetime(value) : lifetime;
            return store(key, value, now + freshMs, now + staleMs);
          },
          (error) => {
            if (!recover) throw error;
            const retryAt = Date.now() + recover.retryMs;
            const stale = usable(key);
            return store(
              key,
              stale ? stale.value : recover.fallback,
              retryAt,
              stale?.staleUntil ?? retryAt,
            );
          },
        )
        .finally(() => pending.delete(key));
      pending.set(key, refresh);
    }

    if (entry) {
      void refresh.catch(() => {});
      return Promise.resolve(entry.value);
    }

    return refresh;
  };
}

/** memoizes an async function by its arguments */
export function cached<Args extends unknown[], T>(
  load: (...args: Args) => Promise<T>,
  lifetime: Lifetime = { freshMs: HOUR, staleMs: DAY },
) {
  const cache = createSwrCache<T>({ lifetime });
  return (...args: Args) => cache(JSON.stringify(args), () => load(...args));
}
