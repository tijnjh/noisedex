import { cn } from "cn";
import type { ComponentProps } from "react";

export function SpotifyWidget({
  className,
  type,
  id,
  ...props
}: ComponentProps<"iframe"> & {
  id: string;
  type: "playlist" | "album" | "artist";
}) {
  return (
    <iframe
      title={`Spotify ${type}`}
      {...props}
      className={cn("h-38 w-full rounded-xl", className)}
      src={`https://open.spotify.com/embed/${type}/${id}`}
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}
