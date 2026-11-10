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
      height={80}
      {...props}
      className={cn("block h-20 w-full shrink-0 rounded-xl", className)}
      src={`https://open.spotify.com/embed/${type}/${id}`}
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}
