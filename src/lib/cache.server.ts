import { LRUCache } from "lru-cache";
import { Time } from "./time.ts";

// values are fresh for `ttl`, then served stale (even when refreshing fails) while they refresh in the background
export function cached<Args extends unknown[], T>(
  load: (...args: Args) => Promise<T>,
  ttl = Time.hour,
) {
  // boxed, since lru-cache can't hold undefined or null
  const cache = new LRUCache<string, { value: T }>({
    max: 500,
    ttl,
    allowStale: true,
    allowStaleOnFetchRejection: true,
    noDeleteOnFetchRejection: true,
    // args are plain json, so the key doubles as the arguments
    fetchMethod: async (key) => ({ value: await load(...(JSON.parse(key) as Args)) }),
  });

  return async (...args: Args) => (await cache.fetch(JSON.stringify(args)))!.value;
}
