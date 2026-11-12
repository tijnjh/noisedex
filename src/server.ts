import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export default createServerEntry({
  fetch(request, options) {
    if (!import.meta.env.DEV) {
      const canonical = new URL(`https://${process.env.CANONICAL_HOST || "nd.tijn.dev"}`);
      const url = new URL(request.url);

      if (url.host !== canonical.host) {
        url.protocol = canonical.protocol;
        url.host = canonical.host;
        url.port = canonical.port;
        return new Response(null, {
          status: 307,
          headers: { Location: url.href, "Cache-Control": "no-store" },
        });
      }
    }

    return handler.fetch(request, options);
  },
});
