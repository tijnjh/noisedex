// bounded and per-process stale-while-revalidate cache with in-flight deduplication
export function cached<Args extends unknown[], T>(
  load: (...args: Args) => Promise<T>,
  freshMs = 60 * 60_000,
  staleMs = 24 * 60 * 60_000,
) {
  const values = new Map<string, { value: T; time: number }>();
  const pending = new Map<string, Promise<T>>();

  return (...args: Args): Promise<T> => {
    const key = JSON.stringify(args);
    const entry = values.get(key);
    const age = entry ? Date.now() - entry.time : Infinity;

    if (entry && age < freshMs) {
      return Promise.resolve(entry.value);
    }

    let refresh = pending.get(key);

    if (!refresh) {
      refresh = Promise.resolve()
        .then(() => load(...args))
        .then((value) => {
          values.delete(key);
          values.set(key, { value, time: Date.now() });
          if (values.size > 500) values.delete(values.keys().next().value!);
          return value;
        })
        .finally(() => pending.delete(key));
      pending.set(key, refresh);
    }

    if (entry && age < staleMs) {
      void refresh.catch(() => {});
      return Promise.resolve(entry.value);
    }

    return refresh;
  };
}
