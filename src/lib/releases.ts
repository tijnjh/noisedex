import type { ItunesClient } from "./itunes";
import type { ResultAlbum, ResultMusicTrack } from "itunes-store-api";

export type ReleaseKind = "album" | "ep" | "single";

export interface Release {
  id: number;
  /** the name as itunes has it, e.g. "Loveless - EP" */
  name: string;
  /** the name without the " - Single" / " - EP" suffix */
  title: string;
  kind: ReleaseKind;
  artistId: number;
  artistName: string;
  artworkUrl: string;
  thumbnailUrl: string;
  releaseDate: string;
  genre: string;
  explicit: boolean;
  trackCount: number;
  appleMusicUrl: string;
}

export interface Track {
  id: number;
  title: string;
  artistId: number;
  artistName: string;
  albumId: number;
  albumName: string;
  artworkUrl: string;
  thumbnailUrl: string;
  previewUrl?: string;
  durationMs?: number;
  releaseDate: string;
  genre: string;
  trackNumber: number;
  trackCount: number;
  discNumber: number;
  discCount: number;
  explicit: boolean;
  appleMusicUrl: string;
}

export interface AlbumWithTracks {
  album: Release;
  tracks: Track[];
}

export interface ArtistReleases {
  itunesArtistId: number;
  albums: Release[];
  eps: Release[];
  singles: Release[];
}

/** accepts only positive integer ids, as strings straight from the url */
export function parseItunesId(raw: string): number | undefined {
  if (!/^\d+$/.test(raw)) return;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return;
  return id;
}

const kindSuffix = / - (Single|EP)$/;

function releaseKind(name: string): ReleaseKind {
  const suffix = kindSuffix.exec(name)?.[1];
  if (suffix === "Single") return "single";
  if (suffix === "EP") return "ep";
  return "album";
}

function bigArtwork(artworkUrl100: string) {
  return artworkUrl100.replace("100x100bb", "600x600bb");
}

function toRelease(album: ResultAlbum): Release {
  return {
    id: album.collectionId,
    name: album.collectionName,
    title: album.collectionName.replace(kindSuffix, ""),
    kind: releaseKind(album.collectionName),
    artistId: album.artistId,
    artistName: album.artistName,
    artworkUrl: bigArtwork(album.artworkUrl100),
    thumbnailUrl: album.artworkUrl60,
    releaseDate: album.releaseDate,
    genre: album.primaryGenreName,
    explicit: album.collectionExplicitness === "explicit",
    trackCount: album.trackCount,
    appleMusicUrl: album.collectionViewUrl,
  };
}

function toTrack(track: ResultMusicTrack): Track {
  return {
    id: track.trackId,
    title: track.trackName,
    artistId: track.artistId,
    artistName: track.artistName,
    albumId: track.collectionId,
    albumName: track.collectionName,
    artworkUrl: bigArtwork(track.artworkUrl100),
    thumbnailUrl: track.artworkUrl60,
    previewUrl: track.previewUrl || undefined,
    durationMs: Number.isFinite(track.trackTimeMillis)
      ? track.trackTimeMillis
      : undefined,
    releaseDate: track.releaseDate,
    genre: track.primaryGenreName,
    trackNumber: track.trackNumber,
    trackCount: track.trackCount,
    discNumber: track.discNumber,
    discCount: track.discCount,
    explicit: track.trackExplicitness === "explicit",
    appleMusicUrl: track.trackViewUrl,
  };
}

/** The Release module: everything noisedex knows about itunes albums and tracks. */
export function createReleases(itunes: ItunesClient) {
  return {
    async getAlbum(rawId: string): Promise<AlbumWithTracks | null> {
      const id = parseItunesId(rawId);
      if (id === undefined) return null;

      const results = await itunes.lookupWithSongs(id);

      // a song lookup on an album id returns the album itself first,
      // followed by its tracks. saves us a request :)
      const [first] = results;
      if (
        !first ||
        first.wrapperType !== "collection" ||
        first.collectionType !== "Album"
      )
        return null;

      const tracks = results
        .filter(
          (result): result is ResultMusicTrack =>
            result.wrapperType === "track",
        )
        .map(toTrack);

      return { album: toRelease(first), tracks };
    },

    async getTrack(rawId: string): Promise<Track | null> {
      const id = parseItunesId(rawId);
      if (id === undefined) return null;

      const results = await itunes.lookupWithSongs(id);
      const track = results.find(
        (result): result is ResultMusicTrack =>
          result.wrapperType === "track" &&
          result.kind === "song" &&
          result.trackId === id,
      );

      return track ? toTrack(track) : null;
    },

    /** null when no itunes artist has exactly this name */
    async getArtistReleases(
      artistName: string,
    ): Promise<ArtistReleases | null> {
      const artists = await itunes.searchArtists(artistName);
      const artist = artists.find(
        (a) => a.artistName.toLowerCase() === artistName.toLowerCase(),
      );
      if (!artist) return null;

      const albums = await itunes.lookupArtistAlbums(artist.artistId);
      const releases: ArtistReleases = {
        itunesArtistId: artist.artistId,
        albums: [],
        eps: [],
        singles: [],
      };

      for (const album of albums) {
        // the clean version is a duplicate of the explicit one
        if (album.collectionExplicitness === "cleaned") continue;

        const release = toRelease(album);
        const bucket = {
          album: "albums",
          ep: "eps",
          single: "singles",
        } as const;
        releases[bucket[release.kind]].push(release);
      }

      return releases;
    },
  };
}

export type Releases = ReturnType<typeof createReleases>;
