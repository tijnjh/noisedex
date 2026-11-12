import logoSvg from "../assets/favicon.svg?raw";
import logoUrl from "../assets/favicon.svg?url";
import { useMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";

function coloredLogo(color?: string) {
  if (!color) return logoUrl;
  const escaped = color.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
  const svg = logoSvg
    .replace(/<style>.*?<\/style>/s, "")
    .replace('fill="#18181b"', `fill="${escaped}"`);
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

  const [resolved, setResolved] = useState<{
    source: Promise<string | undefined>;
    color: string | undefined;
  }>();
  const [failedArtwork, setFailedArtwork] = useState<string>();

  useEffect(() => {
    let active = true;
    if (color instanceof Promise) {
      const source = color;
      void source.then(
        (value) => {
          if (active) setResolved({ source, color: value });
        },
        () => {},
      );
    }
    return () => {
      active = false;
    };
  }, [color]);

  useEffect(() => {
    if (!artwork) return;
    const image = new Image();
    image.onerror = () => setFailedArtwork(artwork);
    image.src = artwork;
    return () => {
      image.onerror = null;
    };
  }, [artwork]);

  const resolvedColor =
    typeof color === "string" ? color : resolved?.source === color ? resolved?.color : undefined;
  const artworkUrl = artwork && artwork !== failedArtwork ? artwork : undefined;

  return (
    <link
      rel="icon"
      href={artworkUrl || coloredLogo(resolvedColor)}
      type={artworkUrl ? undefined : "image/svg+xml"}
    />
  );
}
