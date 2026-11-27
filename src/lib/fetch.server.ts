export class ResponseError extends Error {
  constructor(
    readonly status: number,
    url: string,
  ) {
    super(`Request to ${url} failed with ${status}`);
  }
}

// a json GET that gives up after `timeout` ms
export async function fetchJson<T>(
  url: string,
  {
    timeout,
    params,
    headers,
  }: {
    timeout: number;
    params?: Record<string, string | number>;
    headers?: Record<string, string>;
  },
): Promise<T> {
  const target = new URL(url);
  for (const [key, value] of Object.entries(params ?? {})) {
    target.searchParams.set(key, String(value));
  }

  const response = await fetch(target, {
    headers: { Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) throw new ResponseError(response.status, target.href);

  return (await response.json()) as T;
}
