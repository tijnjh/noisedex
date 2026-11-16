export function SpotifyWidget({ type, id }: { type: "playlist" | "album" | "artist"; id: string }) {
  return (
    <iframe
      title={`Spotify ${type}`}
      height={80}
      className="block h-20 w-full shrink-0 rounded-xl"
      src={`https://open.spotify.com/embed/${type}/${id}`}
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}
