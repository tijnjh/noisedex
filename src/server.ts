import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

const entry = createServerEntry({
  fetch(request, options) {
    if (!import.meta.env.DEV) {
      const host = process.env.CANONICAL_HOST || "noisedex.com";
      const url = new URL(request.url);

      if (url.host !== host) {
        return new Response(null, {
          status: 307,
          headers: {
            Location: `https://${host}${url.pathname}${url.search}`,
            "Cache-Control": "no-store",
          },
        });
      }
    }

    return handler.fetch(request, options);
  },
});

export default {
  fetch(request: Request, options?: Parameters<typeof entry.fetch>[1]) {
    const url = new URL(request.url);

    try {
      decodeURI(url.pathname);
    } catch {
      url.pathname = url.pathname.replaceAll("%", "%25");
      return entry.fetch(new Request(url, request), options);
    }

    return entry.fetch(request, options);
  },
};
