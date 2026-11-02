import type { ArtistReleases } from "./releases";
import type { SpotifyArtist, SpotifyClient } from "./spotify";

export interface Artist {
  spotifyId: string;
  name: string;
  /** everynoise genre names */
  genres: string[];
  /** null when the artist couldn't be matched on itunes */
  itunes: ArtistReleases | null;
}

/** The Artist module: resolves one artist across spotify, itunes and everynoise. */
export function createArtists(deps: {
  spotify: SpotifyClient;
  getArtistReleases: (artistName: string) => Promise<ArtistReleases | null>;
  getArtistGenres: (spotifyId: string) => Promise<string[]>;
}) {
  return {
    async resolve(spotifyId: string): Promise<Artist> {
      const [spotifyArtist, genres] = await Promise.all([
        deps.spotify.getArtist(spotifyId),
        deps.getArtistGenres(spotifyId),
      ]);

      // itunes has no spotify ids, so the name is all we can match on
      const itunes = await deps.getArtistReleases(spotifyArtist.name);

      return { spotifyId, name: spotifyArtist.name, genres, itunes };
    },

    search(query: string): Promise<SpotifyArtist[]> {
      return deps.spotify.searchArtists(query);
    },

    /** "i'm feeling lucky": the best spotify match for a name, if any */
    async findBestMatch(query: string): Promise<SpotifyArtist | undefined> {
      const [best] = await deps.spotify.searchArtists(query);
      return best;
    },
  };
}
