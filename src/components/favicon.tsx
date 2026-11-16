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

export function Favicon() {
  const matches = useMatches();
  let artwork: string | undefined;
  let color: string | Promise<string | undefined> | undefined;

  for (const match of matches) {
    if (match.status !== "success") continue;
    if (match.routeId === "/genre/$slug") color = match.loaderData?.style?.color;
    if (match.routeId === "/$itunesId/") {
      const music = match.loaderData;
      if (music?.type === "artist") color = music.data.accentColor;
      if (music?.type === "album") artwork = music.data.album.artworkUrl100;
      if (music?.type === "track") artwork = music.data.track.artworkUrl100;
    }
  }

  const resolvedColor = useResolved(color);

  return (
    <link
      rel="icon"
      href={artwork ?? coloredLogo(resolvedColor)}
      type={artwork ? undefined : "image/svg+xml"}
    />
  );
}
