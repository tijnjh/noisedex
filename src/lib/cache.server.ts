import { LRUCache } from "lru-cache";

const hour = 60 * 60 * 1000;
export const day = 24 * hour;

// values are fresh for `ttl`, then served stale (even when refreshing fails) while they refresh in the background
export function cached<Args extends unknown[], T>(load: (...args: Args) => Promise<T>, ttl = hour) {
  // boxed, since lru-cache can't hold undefined or null
  const cache = new LRUCache<string, { value: T }>({
    max: 500,
    ttl,
    allowStale: true,
    noDeleteOnFetchRejection: true,
    // args are plain json, so the key doubles as the arguments
    fetchMethod: async (key) => ({ value: await load(...(JSON.parse(key) as Args)) }),
  });

  // a failed first load rejects, as there's nothing stale to serve yet
  return async (...args: Args) => (await cache.fetch(JSON.stringify(args)))!.value;
}
