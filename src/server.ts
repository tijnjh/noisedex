import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export default createServerEntry({
  fetch(request, options) {
    const url = new URL(request.url);
    const host = process.env.CANONICAL_HOST || "noisedex.com";

    if (!import.meta.env.DEV && url.host !== host) {
      return new Response(null, {
        status: 307,
        headers: {
          Location: `https://${host}${url.pathname}${url.search}`,
          "Cache-Control": "no-store",
        },
      });
    }

    return handler.fetch(request, options);
  },
});
