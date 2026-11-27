import type { PlaybackTrack } from "#domain/playback";

export function itunesPlayback(track: {
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
}): PlaybackTrack {
  return {
    title: track.trackName,
    artist: track.artistName,
    artworkSrc: track.artworkUrl100,
    url: track.previewUrl,
  };
}

// the example track everynoise attaches to genres and artists, titled like `e.g. Artist "Title"`
export function previewPlayback(preview: { title: string; url: string }): PlaybackTrack {
  const match = preview.title
    .replace(/^e\.g\./, "")
    .trim()
    .match(/^(.+?)\s+"([\s\S]*)"$/);

  return match
    ? { artist: match[1]!, title: match[2]!, url: preview.url }
    : { title: preview.title, url: preview.url };
}
