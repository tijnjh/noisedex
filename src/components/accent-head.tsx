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

export function usePageAccent() {
  const matches = useMatches();
  let artwork: string | undefined;
  let color: string | Promise<string | undefined> | undefined;
  let background: string | Promise<string | undefined> | undefined;
  let middle: string | Promise<string | undefined> | undefined;

  for (const match of matches) {
    if (match.status !== "success") continue;
    if (match.routeId === "/genre/$slug") color = match.loaderData?.style?.color;
    if (match.routeId === "/$itunesId/" && match.loaderData) {
      const music = match.loaderData;
      color = music.data.accentColor;
      if ("backgroundColor" in music.data) {
        background = music.data.backgroundColor;
        middle = music.data.middleColor;
      }
      if (music.type === "album") artwork = music.data.album.artworkUrl100;
      if (music.type === "track") artwork = music.data.track.artworkUrl100;
    }
  }

  return {
    artwork,
    color: useResolved(color).value,
    // the plain page background behind the accent gradients
    background: useResolved(background).value,
    // the top gradient passes through it on the way from color to background
    middle: useResolved(middle).value,
  };
}

// favicon and browser theme-color, both tinted with the current page's accent color
export function AccentHead() {
  const { artwork, color } = usePageAccent();

  return (
    <>
      <link
        rel="icon"
        href={artwork ?? coloredLogo(color)}
        type={artwork ? undefined : "image/svg+xml"}
      />

      {color ? (
        <meta name="theme-color" content={color} />
      ) : (
        <>
          <meta name="theme-color" media="(prefers-color-scheme: light)" content="#e4e4e7" />
          <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#27272a" />
        </>
      )}
    </>
  );
}
