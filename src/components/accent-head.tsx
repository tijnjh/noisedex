import { useResolved } from "#hooks/use-resolved";
import logoSvg from "../assets/favicon.svg?raw";
import logoUrl from "../assets/favicon.svg?url";
import { useMatches } from "@tanstack/react-router";

function coloredLogo(color?: string) {
  if (!color) return logoUrl;
  const svg = logoSvg
    .replace(/<style>.*?<\/style>/s, "")
    .replace('fill="#18181b"', `fill="${color}"`);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// favicon and browser theme-color, both tinted with the current page's accent color
export function AccentHead() {
  const matches = useMatches();
  let artwork: string | undefined;
  let color: string | Promise<string | undefined> | undefined;

  for (const match of matches) {
    if (match.status !== "success") continue;
    if (match.routeId === "/genre/$slug") color = match.loaderData?.style?.color;
    if (match.routeId === "/$itunesId/" && match.loaderData) {
      const music = match.loaderData;
      color = music.data.accentColor;
      if (music.type === "album") artwork = music.data.album.artworkUrl100;
      if (music.type === "track") artwork = music.data.track.artworkUrl100;
    }
  }

  const resolvedColor = useResolved(color).value;

  return (
    <>
      <link
        rel="icon"
        href={artwork ?? coloredLogo(resolvedColor)}
        type={artwork ? undefined : "image/svg+xml"}
      />

      {resolvedColor ? (
        <meta name="theme-color" content={resolvedColor} />
      ) : (
        <>
          <meta name="theme-color" media="(prefers-color-scheme: light)" content="#e4e4e7" />
          <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#27272a" />
        </>
      )}
    </>
  );
}
